/* ================================================================
   PostOBT | 1_login.js
   Contains: Login, Register, OTP Logic
   Used by : 1_login.html
   Redirects to: 2_dashboard.html on login
================================================================ */
    // ── STATE ──
    const state = {
      emailOtp: null, mobileOtp: null,
      emailVerified: false, mobileVerified: false,
    };

    // ── TAB SWITCH ──
    function switchTab(tab) {
      document.getElementById('loginView').classList.toggle('active', tab === 'login');
      document.getElementById('registerView').classList.toggle('active', tab === 'register');
      document.getElementById('loginTab').classList.toggle('active', tab === 'login');
      document.getElementById('registerTab').classList.toggle('active', tab === 'register');
    }

    // ── PASSWORD TOGGLE ──
    function togglePassword(inputId, btn) {
      const input = document.getElementById(inputId);
      const icon = btn.querySelector('i');
      if (input.type === 'password') {
        input.type = 'text';
        input.classList.add('pwd-field');
        icon.className = 'fa-regular fa-eye-slash';
      } else {
        input.type = 'password';
        input.classList.remove('pwd-field');
        icon.className = 'fa-regular fa-eye';
      }
    }

    // ── TOAST ──
    function showToast(msg, isError = false) {
      const t = document.getElementById('toast');
      const icon = t.querySelector('i');
      document.getElementById('toastMsg').textContent = msg;
      icon.className = isError ? 'fa-solid fa-triangle-exclamation' : 'fa-solid fa-circle-check';
      icon.style.color = isError ? '#f97316' : '#22c55e';
      t.classList.add('show');
      setTimeout(() => t.classList.remove('show'), 3500);
    }

    // ── LOADING BUTTON ──
    function setLoading(btn, loading) {
      if (loading) {
        btn.dataset.original = btn.innerHTML;
        btn.innerHTML = '<span class="btn-spinner"></span> Please wait…';
        btn.disabled = true;
      } else {
        btn.innerHTML = btn.dataset.original;
        btn.disabled = false;
      }
    }

    // ── GENERATE OTP ──
    function generateOTP() {
      return Math.floor(100000 + Math.random() * 900000).toString();
    }

    // ── SEND OTP ──
    function sendOTP(channel) {
      const isEmail = channel === 'email';
      const inputId = isEmail ? 'reg-email' : 'reg-mobile';
      const btnId   = isEmail ? 'sendEmailOtpBtn' : 'sendMobileOtpBtn';
      const inlineId = isEmail ? 'emailOtpInline' : 'mobileOtpInline';
      const val = document.getElementById(inputId).value.trim();

      // Validate
      if (isEmail && (!val || !val.includes('@'))) {
        showToast('Please enter a valid email first 📧', true); return;
      }
      if (!isEmail && (!val || val.length < 7)) {
        showToast('Please enter a valid mobile number first 📱', true); return;
      }

      const otp = generateOTP();
      if (isEmail) { state.emailOtp = otp; state.emailVerified = false; }
      else          { state.mobileOtp = otp; state.mobileVerified = false; }

      const btn = document.getElementById(btnId);
      const prevHtml = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<span class="btn-spinner"></span>';

      setTimeout(() => {
        btn.innerHTML = '<i class="fa-solid fa-check"></i> Sent';
        btn.style.background = '#22c55e';

        // Show inline OTP box
        const inline = document.getElementById(inlineId);
        inline.classList.add('show');

        // Reset verified badge
        const badge = document.getElementById(isEmail ? 'emailVerified' : 'mobileVerified');
        badge.classList.remove('show');

        // Reset OTP boxes
        const prefix = isEmail ? 'eotp' : 'motp';
        for (let i = 0; i < 6; i++) {
          const b = document.getElementById(prefix + i);
          b.value = ''; b.classList.remove('filled', 'error');
        }

        const code = !isEmail ? document.getElementById('countryCode').value : '';
        const dest  = isEmail ? val : `${code} ${val}`;
        showToast(`OTP sent to ${dest}! (Demo OTP: ${otp})`);
        startTimer(channel);

        // Focus first box
        setTimeout(() => document.getElementById(prefix + '0').focus(), 100);
      }, 900);
    }

    // ── TIMER ──
    function startTimer(channel) {
      const timerId  = channel === 'email' ? 'emailTimer' : 'mobileTimer';
      const resendId = channel === 'email' ? 'resendEmailBtn' : 'resendMobileBtn';
      const rb = document.getElementById(resendId);
      if (rb) rb.disabled = true;
      let seconds = 120;
      const interval = setInterval(() => {
        seconds--;
        const m = String(Math.floor(seconds / 60)).padStart(2, '0');
        const s = String(seconds % 60).padStart(2, '0');
        const el = document.getElementById(timerId);
        if (el) el.textContent = `${m}:${s}`;
        if (seconds <= 0) {
          clearInterval(interval);
          if (el) el.textContent = '00:00';
          if (rb) rb.disabled = false;
        }
      }, 1000);
    }

    // ── RESEND OTP ──
    function resendOTP(channel) {
      const isEmail  = channel === 'email';
      const resendId = isEmail ? 'resendEmailBtn' : 'resendMobileBtn';
      const timerId  = isEmail ? 'emailTimer' : 'mobileTimer';
      const prefix   = isEmail ? 'eotp' : 'motp';

      document.getElementById(resendId).disabled = true;
      document.getElementById(timerId).textContent = '02:00';

      const otp = generateOTP();
      if (isEmail) { state.emailOtp = otp; state.emailVerified = false; }
      else          { state.mobileOtp = otp; state.mobileVerified = false; }

      for (let i = 0; i < 6; i++) {
        const b = document.getElementById(prefix + i);
        b.value = ''; b.classList.remove('filled', 'error');
      }
      const badge = document.getElementById(isEmail ? 'emailVerified' : 'mobileVerified');
      badge.classList.remove('show');

      showToast(`🔄 New OTP sent! (Demo: ${otp})`);
      startTimer(channel);
      setTimeout(() => document.getElementById(prefix + '0').focus(), 100);
    }

    // ── OTP BOX INPUT ──
    function otpInput(el, prefix, idx) {
      el.value = el.value.replace(/\D/g, '').slice(-1);
      if (el.value) {
        el.classList.add('filled');
        if (idx < 5) document.getElementById(prefix + (idx + 1)).focus();
        else verifyOTP(prefix);
      } else {
        el.classList.remove('filled');
      }
    }
    function otpKeydown(e, el, prefix, idx) {
      if (e.key === 'Backspace' && !el.value && idx > 0)
        document.getElementById(prefix + (idx - 1)).focus();
    }

    // ── VERIFY OTP (auto on last digit) ──
    function verifyOTP(prefix) {
      const channel = prefix === 'eotp' ? 'email' : 'mobile';
      const entered = Array.from({length:6}, (_,i) => document.getElementById(prefix+i).value).join('');
      const correct = channel === 'email' ? state.emailOtp : state.mobileOtp;

      if (entered === correct) {
        // Mark verified
        if (channel === 'email') {
          state.emailVerified = true;
          document.getElementById('emailVerified').classList.add('show');
          // Collapse OTP inline box after success
          setTimeout(() => document.getElementById('emailOtpInline').classList.remove('show'), 600);
        } else {
          state.mobileVerified = true;
          document.getElementById('mobileVerified').classList.add('show');
          setTimeout(() => document.getElementById('mobileOtpInline').classList.remove('show'), 600);
        }
        showToast(channel === 'email' ? '✅ Email verified!' : '✅ Mobile verified!');
      } else {
        // Shake & clear
        for (let i = 0; i < 6; i++) {
          const b = document.getElementById(prefix + i);
          b.classList.add('error');
          setTimeout(() => b.classList.remove('error'), 500);
        }
        showToast('❌ Wrong OTP. Try again.', true);
        setTimeout(() => {
          for (let i = 0; i < 6; i++) {
            const b = document.getElementById(prefix + i);
            b.value = ''; b.classList.remove('filled');
          }
          document.getElementById(prefix + '0').focus();
        }, 600);
      }
    }

    // ── FINALIZE REGISTER ──
    function finalizeRegister() {
      const u = document.getElementById('reg-username').value.trim();
      const e = document.getElementById('reg-email').value.trim();
      const m = document.getElementById('reg-mobile').value.trim();
      const p = document.getElementById('reg-password').value.trim();

      if (!u)                      { showToast('Please enter a username', true); return; }
      if (!e || !e.includes('@'))   { showToast('Please enter a valid email', true); return; }
      if (!m || m.length < 7)       { showToast('Please enter a valid mobile number', true); return; }
      if (!p || p.length < 8)       { showToast('Password must be at least 8 characters', true); return; }
      if (!state.emailOtp)          { showToast('Please send & verify your Email OTP 📧', true); return; }
      if (!state.mobileOtp)         { showToast('Please send & verify your Mobile OTP 📱', true); return; }
      if (!state.emailVerified)     { showToast('Please verify your Email OTP first 📧', true); document.getElementById('emailOtpInline').classList.add('show'); return; }
      if (!state.mobileVerified)    { showToast('Please verify your Mobile OTP first 📱', true); document.getElementById('mobileOtpInline').classList.add('show'); return; }

      const btn = document.getElementById('finalRegBtn');
      setLoading(btn, true);

      setTimeout(() => {
        const code = document.getElementById('countryCode').value;
        localStorage.setItem('postobt_username', u);
        localStorage.setItem('postobt_email', e);
        localStorage.setItem('postobt_mobile', code + m);
        localStorage.setItem('postobt_password', p);
        localStorage.setItem('postobt_display_name', u);
        localStorage.setItem('postobt_display_email', e);

        setLoading(btn, false);
        showToast('🎉 Account created! You can now sign in.');

        // Reset state
        state.emailOtp = null; state.mobileOtp = null;
        state.emailVerified = false; state.mobileVerified = false;

        setTimeout(() => switchTab('login'), 1400);
      }, 1000);
    }

    // ── LOGIN ──
    function handleLogin() {
      const u = document.getElementById('login-username').value.trim();
      const p = document.getElementById('login-password').value.trim();
      if (!u || !p) { showToast('Please fill in all fields ⚠️', true); return; }

      const btn = document.querySelector('#loginView .submit-btn');
      setLoading(btn, true);

      setTimeout(() => {
        const savedUser = localStorage.getItem('postobt_username');
        const savedEmail = localStorage.getItem('postobt_email');
        const savedPass  = localStorage.getItem('postobt_password');

        if ((u === savedUser || u === savedEmail) && p === savedPass) {
          // Save logged-in user info for dashboard
          localStorage.setItem('postobt_loggedin', 'true');
          localStorage.setItem('postobt_display_name', savedUser || u);
          localStorage.setItem('postobt_display_email', savedEmail || '');

          showToast('Login successful! Redirecting… 🚀');
          setTimeout(() => {
            document.querySelector('.auth-card').style.transition = 'all 0.6s ease';
            document.querySelector('.auth-card').style.transform = 'scale(0.98) translateY(10px)';
            document.querySelector('.auth-card').style.opacity = '0';
          }, 800);
          setTimeout(() => { window.location.href = '2_dashboard.html'; }, 1400);
        } else {
          setLoading(btn, false);
          showToast('Invalid username or password ❌', true);
          const card = document.querySelector('.auth-card');
          card.style.animation = 'shake 0.4s ease';
          setTimeout(() => card.style.animation = '', 400);
        }
      }, 900);
    }
