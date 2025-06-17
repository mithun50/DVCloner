document.addEventListener('DOMContentLoaded', function() {
  // Language selector interaction
  const languageOptions = document.querySelectorAll('.language-option');
  languageOptions.forEach(option => {
    option.addEventListener('click', function() {
      languageOptions.forEach(opt => opt.classList.remove('selected'));
      this.classList.add('selected');
      // Check the radio button
      const radio = this.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
    });
  });

  // File upload handling
  const audioInput = document.getElementById('audioInput');
  const uploadArea = document.querySelector('.file-upload');
  const audioPreview = document.getElementById('audioPreview');
  const uploadedAudio = document.getElementById('uploadedAudio');

  audioInput.addEventListener('change', function() {
    if (this.files.length > 0) {
      const file = this.files[0];
      const fileSize = (file.size / 1024 / 1024).toFixed(2);

      uploadArea.innerHTML = `
        <i class="fas fa-check-circle" style="color: var(--success); font-size: 2rem;"></i>
        <p style="font-weight: 500; color: var(--success); margin: 0.5rem 0;">${file.name}</p>
        <p class="small" style="color: var(--gray-600);">${fileSize} MB</p>
        <p class="small" style="color: var(--gray-500); margin-top: 0.5rem;">Click to change file</p>
      `;

      uploadArea.style.borderColor = 'var(--success)';
      uploadArea.style.background = 'rgba(16, 185, 129, 0.05)';

      // Show audio preview
      const fileURL = URL.createObjectURL(file);
      uploadedAudio.src = fileURL;
      audioPreview.style.display = 'block';

      // Clean up the object URL when audio is loaded
      uploadedAudio.addEventListener('loadeddata', function() {
        // Optionally revoke the URL after some time to free memory
        setTimeout(() => {
          URL.revokeObjectURL(fileURL);
        }, 60000); // Revoke after 1 minute
      });
    } else {
      // Hide preview if no file
      audioPreview.style.display = 'none';
      uploadedAudio.src = '';
    }
  });

  // Drag and drop functionality
  uploadArea.addEventListener('dragover', function(e) {
    e.preventDefault();
    this.style.borderColor = 'var(--primary)';
    this.style.background = 'rgba(79, 70, 229, 0.05)';
  });

  uploadArea.addEventListener('dragleave', function(e) {
    e.preventDefault();
    if (!audioInput.files.length) {
      this.style.borderColor = 'var(--gray-300)';
      this.style.background = 'var(--gray-50)';
    }
  });

  uploadArea.addEventListener('drop', function(e) {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('audio/')) {
      audioInput.files = files;
      audioInput.dispatchEvent(new Event('change'));
    }
    // Reset drag styles
    this.style.borderColor = 'var(--gray-300)';
    this.style.background = 'var(--gray-50)';
  });

  // Form submission
  const form = document.getElementById('cloneForm');
  const loader = document.getElementById('loader');
  const result = document.getElementById('result');
  const submitBtn = document.querySelector('.btn[type="submit"]');
  const originalBtnText = submitBtn.innerHTML;

  form.addEventListener('submit', async function(e) {
    e.preventDefault();

    // Show loader and hide previous results
    loader.style.display = 'block';
    result.style.display = 'none';
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    submitBtn.disabled = true;

    // Clear previous errors
    const existingErrors = document.querySelectorAll('.error-message');
    existingErrors.forEach(el => el.remove());

    // Smooth scroll to loader
    loader.scrollIntoView({ behavior: 'smooth', block: 'center' });

    try {
      // Get form elements
      const textInput = document.getElementById('text');
      const refTextInput = document.getElementById('ref_text');

      // Validation
      if (!textInput.value.trim()) {
        throw new Error('Please enter text to synthesize');
      }

      if (textInput.value.trim().length < 10) {
        throw new Error('Text should be at least 10 characters long');
      }

      if (!refTextInput.value.trim()) {
        throw new Error('Please enter reference text (what was spoken in your audio)');
      }

      if (!audioInput.files || audioInput.files.length === 0) {
        throw new Error('Please upload an audio file');
      }

      // Check file size (max 50MB)
      const maxSize = 50 * 1024 * 1024;
      if (audioInput.files[0].size > maxSize) {
        throw new Error('Audio file is too large. Please use a file smaller than 50MB');
      }

      // Prepare form data
      const formData = new FormData();
      formData.append('text', textInput.value.trim());
      formData.append('audio', audioInput.files[0]);
      formData.append('ref_text', refTextInput.value.trim());
      formData.append('language', document.querySelector('input[name="language"]:checked').value);

      // Make the request
      const response = await fetch('/synthesize', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status}. ${errorText}`);
      }

      const data = await response.json();

      if (data.success && data.url) {
        const audioPlayer = result.querySelector('audio');
        const downloadLink = result.querySelector('.download-btn');

        audioPlayer.src = data.url;
        downloadLink.href = data.url;

        const fileName = `voice_clone_${new Date().getTime()}.wav`;
        downloadLink.download = fileName;

        result.style.display = 'block';

        // Smooth scroll to result
        setTimeout(() => {
          result.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
          <p style="margin: 0; font-weight: 500;">Error</p>
          <p style="margin: 0.25rem 0 0 0; font-size: 0.875rem;">${error.message}</p>
        </div>
      `;

      form.parentNode.insertBefore(errorElement, form.nextSibling);

      setTimeout(() => {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);

      // Auto-remove error after 8 seconds
      setTimeout(() => {
        if (errorElement.parentNode) {
          errorElement.style.opacity = '0';
          setTimeout(() => errorElement.remove(), 300);
        }
      }, 8000);

    } finally {
      loader.style.display = 'none';
      submitBtn.innerHTML = originalBtnText;
      submitBtn.disabled = false;
    }
  });

  // Examples functionality
  const exampleButtons = document.querySelectorAll('.example-btn');
  const textInput = document.getElementById('text');
  const refTextInput = document.getElementById('ref_text');

  exampleButtons.forEach(button => {
    button.addEventListener('click', function() {
      const lang = this.dataset.lang;
      const text = this.dataset.text;
      const refText = this.dataset.ref;

      // Fill the text areas
      textInput.value = text;
      refTextInput.value = refText;

      // Select the corresponding language
      const languageRadio = document.querySelector(`input[name="language"][value="${lang}"]`);
      if (languageRadio) {
        languageRadio.checked = true;
        
        // Update visual selection
        languageOptions.forEach(opt => opt.classList.remove('selected'));
        languageRadio.closest('.language-option').classList.add('selected');
      }

      // Visual feedback
      this.style.background = 'var(--primary)';
      this.style.color = 'var(--white)';
      this.style.transform = 'scale(0.95)';

      setTimeout(() => {
        this.style.background = '';
        this.style.color = '';
        this.style.transform = '';
      }, 200);

      // Update input validation styling
      textInput.style.borderColor = 'var(--success)';
      refTextInput.style.borderColor = 'var(--success)';
    });
  });

  // Load contributors
    // Load contributors
  async function loadContributors() {
    const container = document.getElementById("contributors");

    container.innerHTML = `
      <div class="contributors-loading">
        <div class="spinner" style="width: 1.5rem; height: 1.5rem; margin: 0 auto 0.5rem;"></div>
        <p style="font-size: 0.875rem;">Loading contributors...</p>
      </div>
    `;

    try {
      const response = await fetch("/api/contributors");

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (!data || data.length === 0) {
        container.innerHTML = `
          <div class="contributors-empty">
            <p style="font-size: 0.875rem;">No contributors found</p>
          </div>
        `;
        return;
      }

      container.innerHTML = '';

      data.forEach((user) => {
        const contributor = document.createElement("a");
        contributor.className = "contributor";
        contributor.href = user.html_url;
        contributor.target = "_blank";
        contributor.rel = "noopener noreferrer";

        const contributionText = user.contributions === 1 ? '1 commit' : `${user.contributions} commits`;
        const displayName = user.name && user.name.trim() ? user.name : user.login;
        
        contributor.innerHTML = `
          <img src="${user.avatar_url}" alt="${displayName}" loading="lazy" 
               onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=4f46e5&color=ffffff&size=40'" />
          <div class="contributor-info">
            <p class="contributor-name">${displayName}</p>
            <p class="contributor-stats">
              <span class="contributor-badge">${contributionText}</span>
            </p>
          </div>
          <i class="fas fa-external-link-alt contributor-link-icon"></i>
        `;

        container.appendChild(contributor);
      });

    } catch (error) {
      console.error('Error loading contributors:', error);
      container.innerHTML = `
        <div class="contributors-error">
          <p style="margin: 0; font-weight: 500; font-size: 0.875rem;">Could not load contributors</p>
          <p style="margin: 0.5rem 0 0 0; font-size: 0.75rem;">Check your connection and refresh</p>
        </div>
      `;
    }
  }

  loadContributors();

  // Form validation feedback
  const inputs = document.querySelectorAll('.input-field');
  inputs.forEach(input => {
    input.addEventListener('input', function() {
      if (this.value.trim()) {
        this.style.borderColor = 'var(--success)';
      } else {
        this.style.borderColor = 'var(--gray-300)';
      }
    });
  });

  // Auto-save form data
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

  // Keyboard shortcuts
  document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!submitBtn.disabled) {
        submitBtn.click();
      }
    }
  });
});

