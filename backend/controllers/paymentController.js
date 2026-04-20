const Razorpay = require('razorpay');
const crypto = require('crypto');
const Payment = require('../models/Payment');
const Wish = require('../models/Wish');
const FulfillmentRequest = require('../models/FulfillmentRequest');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

exports.createRazorpayOrder = async (req, res) => {
  try {
    const { fulfillmentRequestId, amount, currency = 'INR' } = req.body;

    if (!fulfillmentRequestId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Fulfillment request ID and amount are required'
      });
    }

    const fulfillmentRequest = await FulfillmentRequest.findById(fulfillmentRequestId);
    if (!fulfillmentRequest) {
      return res.status(404).json({
        success: false,
        message: 'Fulfillment request not found'
      });
    }

    const options = {
      amount: amount * 100, // Amount in paise
      currency: currency,
      receipt: `fulfillment_${fulfillmentRequestId}_${Date.now()}`,
      notes: {
        fulfillmentRequestId: fulfillmentRequestId,
        userId: req.user.id,
        wishId: fulfillmentRequest.wishId
      }
    };

    const order = await razorpay.orders.create(options);

    // Save payment record
    const payment = await Payment.create({
      orderId: order.id,
      userId: req.user.id,
      wishId: fulfillmentRequest.wishId,
      amount: amount,
      currency: currency,
      gateway: 'Razorpay',
      status: 'Created'
    });

    res.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID
      },
      paymentId: payment._id
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, fulfillmentRequestId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing payment verification data'
      });
    }

    // Verify signature
    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest('hex');

    if (razorpay_signature !== expectedSign) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    // Update payment record
    const payment = await Payment.findOneAndUpdate(
      { orderId: razorpay_order_id },
      {
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
        status: 'Paid'
      },
      { new: true }
    );

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }

    // Update fulfillment request if provided
    if (fulfillmentRequestId) {
      await FulfillmentRequest.findByIdAndUpdate(
        fulfillmentRequestId,
        { paymentId: payment._id, status: 'Approved' }
      );
    }

    res.json({
      success: true,
      message: 'Payment verified successfully',
      payment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getPaymentHistory = async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user.id })
      .populate('wishId', 'title category budget')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      payments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};