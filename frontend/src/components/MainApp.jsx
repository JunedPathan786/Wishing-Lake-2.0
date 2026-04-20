// Main App Component
export default function WishingLakeApp() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [darkMode, setDarkMode] = useState(true);
  const [currentPage, setCurrentPage] = useState('home');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      api.getMe(token).then(res => {
        if (res.success) {
          setUser(res.user);
        } else {
          localStorage.removeItem('token');
          setToken(null);
        }
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = (newToken, userData) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData);
    setCurrentPage('dashboard');
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setCurrentPage('home');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-white border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      <div className={darkMode ? 'dark' : ''}>
        <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
          <Navbar darkMode={darkMode} setDarkMode={setDarkMode} currentPage={currentPage} setCurrentPage={setCurrentPage} />
          
          <AnimatePresence mode="wait">
            {currentPage === 'home' && !user && <LandingPage setCurrentPage={setCurrentPage} />}
            {currentPage === 'login' && !user && <LoginPage setCurrentPage={setCurrentPage} />}
            {currentPage === 'register' && !user && <RegisterPage setCurrentPage={setCurrentPage} />}
            {currentPage === 'dashboard' && user && <Dashboard setCurrentPage={setCurrentPage} />}
            {currentPage === 'toss-wish' && user && <TossWishPage setCurrentPage={setCurrentPage} />}
            {currentPage === 'fulfill-wish' && user && <FulfillWishPage setCurrentPage={setCurrentPage} />}
            {currentPage === 'my-wishes' && user && <MyWishesPage />}
          </AnimatePresence>
        </div>
      </div>
    </AuthContext.Provider>
  );
}