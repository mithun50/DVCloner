document.addEventListener('DOMContentLoaded', function() {
  // Language selector interaction
  const languageOptions = document.querySelectorAll('.language-option');
  languageOptions.forEach(option => {
    option.addEventListener('click', function() {
      languageOptions.forEach(opt => opt.classList.remove('selected'));
      this.classList.add('selected');
    });
  });

  // File upload display
  const audioInput = document.getElementById('audioInput');
  const uploadArea = document.querySelector('.file-upload');
  
  audioInput.addEventListener('change', function() {
    if (this.files.length > 0) {
      const file = this.files[0];
      const fileSize = (file.size / 1024 / 1024).toFixed(2);
      
      uploadArea.innerHTML = `
        <i class="fas fa-check-circle" style="color: var(--success); font-size: 2.5rem;"></i>
        <p style="font-weight: 600; color: var(--success); margin: 0.75rem 0 0.5rem;">${file.name}</p>
        <p class="small" style="color: var(--gray);">${fileSize} MB</p>
        <p class="small" style="color: var(--gray); margin-top: 0.5rem;">Click to change file</p>
      `;
      
      // Add success styling
      uploadArea.style.borderColor = 'var(--success)';
      uploadArea.style.background = 'rgba(16, 185, 129, 0.05)';
    }
  });

  // Drag and drop functionality
  uploadArea.addEventListener('dragover', function(e) {
    e.preventDefault();
    this.style.borderColor = 'var(--primary)';
    this.style.background = 'rgba(79, 70, 229, 0.1)';
  });

  uploadArea.addEventListener('dragleave', function(e) {
    e.preventDefault();
    if (!audioInput.files.length) {
      this.style.borderColor = '#cbd5e1';
      this.style.background = '#f8fafc';
    }
  });

  uploadArea.addEventListener('drop', function(e) {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('audio/')) {
      audioInput.files = files;
      audioInput.dispatchEvent(new Event('change'));
    }
  });

  // Form submission
  const form = document.getElementById('cloneForm');
  const loader = document.getElementById('loader');
  const result = document.getElementById('result');
  
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Show loader and hide previous results
    loader.style.display = 'block';
    result.style.display = 'none';
    
    // Clear previous errors
    const existingErrors = document.querySelectorAll('.error-message');
    existingErrors.forEach(el => el.remove());

    // Smooth scroll to loader
    loader.scrollIntoView({ behavior: 'smooth', block: 'center' });

    try {
      // Get form elements
      const textInput = document.getElementById('text');
      const refTextInput = document.getElementById('ref_text');
      
      // Enhanced validation
      if (!textInput.value.trim()) {
        throw new Error('Text to synthesize is required');
      }
      
      if (textInput.value.trim().length < 10) {
        throw new Error('Text to synthesize should be at least 10 characters long');
      }
      
      if (!refTextInput.value.trim()) {
        throw new Error('Reference text is required - enter what was spoken in your sample audio');
      }
      
      if (refTextInput.value.trim().length < 5) {
        throw new Error('Reference text should be at least 5 characters long');
      }
      
      if (!audioInput.files || audioInput.files.length === 0) {
        throw new Error('Please select an audio file first');
      }

      // Check file size (max 50MB)
      const maxSize = 50 * 1024 * 1024; // 50MB in bytes
      if (audioInput.files[0].size > maxSize) {
        throw new Error('Audio file is too large. Please use a file smaller than 50MB');
      }

      // Check file type
      const allowedTypes = ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/m4a', 'audio/aac', 'audio/ogg'];
      if (!allowedTypes.some(type => audioInput.files[0].type.includes(type.split('/')[1]))) {
        console.log('File type:', audioInput.files[0].type); // For debugging
        // Allow the upload anyway since browser detection isn't perfect
      }

      // Prepare form data
      const formData = new FormData();
      formData.append('text', textInput.value.trim());
      formData.append('audio', audioInput.files[0]);
      formData.append('ref_text', refTextInput.value.trim());
      formData.append('language', document.querySelector('input[name="language"]:checked').value);

      // Add loading progress indicator
      let progressDots = 0;
      const progressInterval = setInterval(() => {
        progressDots = (progressDots + 1) % 4;
        const dots = '.'.repeat(progressDots);
        const loadingText = loader.querySelector('p');
        if (loadingText) {
          loadingText.textContent = `Cloning your voice${dots}`;
        }
      }, 500);

      // Make the request
      const response = await fetch('/synthesize', {
        method: 'POST',
        body: formData
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} ${response.statusText}. ${errorText}`);
      }

      const data = await response.json();
      
      if (data.success && data.url) {
        const audioPlayer = result.querySelector('audio');
        const downloadLink = result.querySelector('.download-btn');
        
        audioPlayer.src = data.url;
        downloadLink.href = data.url;
        
        // Add file name to download
        const fileName = `voice_clone_${new Date().getTime()}.wav`;
        downloadLink.download = fileName;
        
        result.style.display = 'block';
        
        // Smooth scroll to result
        setTimeout(() => {
          result.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
        
        // Add success animation
        const resultCard = result.querySelector('.result-card');
        resultCard.style.opacity = '0';
        resultCard.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
          resultCard.style.transition = 'all 0.5s ease';
          resultCard.style.opacity = '1';
          resultCard.style.transform = 'translateY(0)';
        }, 100);
        
      } else {
        throw new Error(data.error || 'Voice generation failed. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      
      // Create and show error message
      const errorElement = document.createElement('div');
      errorElement.className = 'error-message';
      errorElement.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <div>
          <p style="margin: 0; font-weight: 600;">Error</p>
          <p style="margin: 0; font-size: 0.9rem;">${error.message}</p>
        </div>
      `;
      
      // Insert error message after the form
      form.parentNode.insertBefore(errorElement, form.nextSibling);
      
      // Scroll to error message
      setTimeout(() => {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      
      // Auto-remove error after 10 seconds
      setTimeout(() => {
        if (errorElement.parentNode) {
          errorElement.style.transition = 'opacity 0.5s ease';
          errorElement.style.opacity = '0';
          setTimeout(() => {
            errorElement.remove();
          }, 500);
        }
      }, 10000);
      
    } finally {
      loader.style.display = 'none';
    }
  });

  // Load contributors with enhanced error handling
  async function loadContributors() {
    try {
      const response = await fetch("https://api.github.com/repos/mithun50/DVCloner/contributors");
      
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }
      
      const data = await response.json();
      const container = document.getElementById("contributors");
      
      if (!data || data.length === 0) {
        container.innerHTML = `
          <p style="grid-column: 1 / -1; text-align: center; color: var(--gray); font-style: italic;">
            <i class="fas fa-users"></i> No contributors found
          </p>
        `;
        return;
      }
      
      container.innerHTML = ''; // Clear existing content
      
      data.forEach((user, index) => {
        const contributor = document.createElement("a");
        contributor.className = "contributor";
        contributor.href = user.html_url;
        contributor.target = "_blank";
        contributor.rel = "noopener noreferrer";
        contributor.style.animationDelay = `${index * 0.1}s`;
        contributor.innerHTML = `
          <img src="${user.avatar_url}" alt="${user.login}" loading="lazy" 
               onerror="this.src='https://via.placeholder.com/70x70/4f46e5/ffffff?text=${user.login.charAt(0).toUpperCase()}'" />
          <p>${user.login}</p>
          <small style="color: var(--gray); font-size: 0.8rem;">${user.contributions} contributions</small>
        `;
        container.appendChild(contributor);
      });
      
    } catch (error) {
      console.error('Error loading contributors:', error);
      document.getElementById("contributors").innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; color: var(--gray); padding: 1rem;">
          <i class="fas fa-exclamation-triangle" style="font-size: 1.5rem; margin-bottom: 0.5rem; color: var(--error);"></i>
          <p style="margin: 0;">Could not load contributors</p>
          <p style="margin: 0; font-size: 0.8rem;">Check your internet connection</p>
        </div>
      `;
    }
  }

  // Load contributors on page load
  loadContributors();

  // Form validation enhancements
  const inputs = document.querySelectorAll('.input-field');
  inputs.forEach(input => {
    // Real-time validation feedback
    input.addEventListener('input', function() {
      this.style.borderColor = this.value.trim() ? 'var(--success)' : '#e2e8f0';
    });

    // Enhanced focus effects
    input.addEventListener('focus', function() {
      this.parentElement.style.transform = 'translateY(-2px)';
    });

    input.addEventListener('blur', function() {
      this.parentElement.style.transform = 'translateY(0)';
    });
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + Enter to submit form
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      const submitBtn = document.querySelector('.btn[type="submit"]');
      if (submitBtn && !loader.style.display || loader.style.display === 'none') {
        submitBtn.click();
      }
    }
    
    // Escape to clear form
    if (e.key === 'Escape') {
      const activeElement = document.activeElement;
      if (activeElement && activeElement.classList.contains('input-field')) {
        activeElement.blur();
      }
    }
  });

  // Auto-save form data to prevent loss
  const formElements = ['text', 'ref_text'];
  
  // Load saved data
  formElements.forEach(id => {
    const element = document.getElementById(id);
    const savedValue = localStorage.getItem(`dvc_${id}`);
    if (savedValue && !element.value) {
      element.value = savedValue;
    }
  });

  // Save data on input
  formElements.forEach(id => {
    const element = document.getElementById(id);
    element.addEventListener('input', function() {
      localStorage.setItem(`dvc_${id}`, this.value);
    });
  });

  // Clear saved data on successful submission
  form.addEventListener('submit', function() {
    setTimeout(() => {
      if (result.style.display !== 'none') {
        formElements.forEach(id => {
          localStorage.removeItem(`dvc_${id}`);
        });
      }
    }, 1000);
  });

  // Add smooth animations on scroll
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, observerOptions);

  // Observe cards for animation
  const cards = document.querySelectorAll('.card');
  cards.forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(card);
  });

  // Add loading states for better UX
  const submitBtn = document.querySelector('.btn[type="submit"]');
  const originalBtnText = submitBtn.innerHTML;
  
  form.addEventListener('submit', function() {
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    submitBtn.disabled = true;
  });

  // Reset button state when done
  const resetButton = () => {
    submitBtn.innerHTML = originalBtnText;
    submitBtn.disabled = false;
  };

  // Reset button on error or success
  const originalFinally = form.addEventListener;
  form.addEventListener('submit', function() {
    setTimeout(resetButton, 100);
  });

  // Add tooltips for language codes
  const languageTooltips = {
    'kn': 'Kannada',
    'hi': 'Hindi', 
    'ta': 'Tamil',
    'te': 'Telugu',
    'gu': 'Gujarati',
    'ml': 'Malayalam',
    'mr': 'Marathi',
    'bn': 'Bengali',
    'pa': 'Punjabi',
    'or': 'Odia'
  };

  languageOptions.forEach(option => {
    const langCode = option.querySelector('input').value;
    const langName = languageTooltips[langCode];
    if (langName) {
      option.title = langName;
      option.setAttribute('data-tooltip', langName);
    }
  });

  console.log('Desi Voice Cloner initialized successfully!');
});