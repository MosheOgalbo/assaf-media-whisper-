(function(){
    try {
      // בדוק localStorage ל־token
      const token = localStorage.getItem('assaf_token');
      // אם אין token — הפנה לעמוד הלוגין (שזה יכול להיות ה-React build או dev server)
      if (!token) {
        // אפשר לבחור כאן היכן נמצא דף הלוגין:
        // - בעת פיתוח בריאקט dev: 'http://localhost:3000'
        // - אחרי build והעתקה ל/login: '/login/index.html'
        // החלף את הכתובת לפי המקרה שלך:
        window.location.href = '/login/index.html';
      }
    } catch(e){
      console.error('Error checking auth token', e);
    }
  })();
