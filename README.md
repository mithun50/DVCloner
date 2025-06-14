# DVCloner (DesiVoiceCloner)

**Clone your voice in your native Indian language!**

DVCloner (DesiVoiceCloner) is an open-source, privacy-focused web application that allows users to synthesize speech in major Indian languages using their own voice as a reference. Powered by Flask (Python), a modern JavaScript/CSS/HTML frontend, and the AI4Bharat IndicF5 model, it enables high-quality voice cloning for educational and experimental use.

---

## Table of Contents

- [About](#about)
- [Features](#features)
- [Supported Languages](#supported-languages)
- [How It Works](#how-it-works)
- [Screenshots](#screenshots)
- [Demo](#demo)
- [Installation](#installation)
  - [Prerequisites](#prerequisites)
  - [Quick Start](#quick-start)
  - [Detailed Steps](#detailed-steps)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgements](#acknowledgements)
- [Contact](#contact)

---

## About

**DesiVoiceCloner** is designed for the Indian context, supporting 10+ major languages. Users can upload a short voice sample (10–30 seconds), provide matching reference text, and synthesize new speech in their own voice for any text in their chosen language.

> **Note:** This project is strictly educational and experimental. All voice processing is privacy-focused and temporary.

---

## Features

- **Voice cloning in 10+ Indian languages**
- **Modern, mobile-friendly web UI**
- **One-click voice generation and instant download**
- **Reference text matching for better accuracy**
- **Privacy-focused: old files are auto-deleted**
- **Based on AI4Bharat's IndicF5 open AI model**
- **Supports multiple audio formats (wav, mp3, m4a, etc.)**
- **Open source and easy to extend**

---

## Supported Languages

- Kannada (`kn`)
- Hindi (`hi`)
- Tamil (`ta`)
- Telugu (`te`)
- Gujarati (`gu`)
- Malayalam (`ml`)
- Marathi (`mr`)
- Bengali (`bn`)
- Punjabi (`pa`)
- Odia (`or`)

*(More can be added with minor code changes.)*

---

## How It Works

1. **Input**: Enter text in your chosen Indian language.
2. **Sample**: Upload a clear voice sample (10–30 seconds) reading a short passage.
3. **Reference**: Enter exactly what was spoken in the audio sample.
4. **Select Language**: Pick your language from the list.
5. **Generate**: Click "Generate Voice"—your cloned voice will be synthesized and available for download.

All processing leverages the AI4Bharat IndicF5 backend for robust and accurate results.

---

## Screenshots

> _Add screenshots of the UI to showcase the app (e.g., input form, results, contributors section, etc.)._

---

## Demo

- [Live Demo](#) (Coming Soon)
- [Video Walkthrough](#) (Optional)

---

## Installation

### Prerequisites

- Python 3.8+
- pip (Python package manager)
- Node.js and npm (if customizing frontend assets)
- `ffmpeg` installed and accessible in your PATH

### Quick Start

```bash
git clone https://github.com/mithun50/DVCloner.git
cd DVCloner
pip install -r requirements.txt
python app.py
```

Visit [http://localhost:5000](http://localhost:5000) in your browser.

### Detailed Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/mithun50/DVCloner.git
   cd DVCloner
   ```

2. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```
   - Flask
   - gradio_client
   - ffmpeg-python

3. **Ensure ffmpeg is installed**
   - On Ubuntu: `sudo apt install ffmpeg`
   - On Mac: `brew install ffmpeg`

4. **Run the app**
   ```bash
   python app.py
   ```
   The app will be available at `http://localhost:5000`.

5. *(Optional)* For frontend development, customize `templates/index.html` and `static/css/style.css`.

---

## Usage

- Open the web app in your browser.
- Enter your text (Indian language only).
- Upload a voice sample (wav/mp3/m4a).
- Fill in the reference text that matches your recording.
- Select your language.
- Click "Generate Voice."
- Listen and download your cloned voice!

> **Note:** English text is not supported in any input field.

---

## Project Structure

```
DVCloner/
├── app.py                  # Flask backend & API routes
├── requirements.txt        # Python dependencies
├── templates/
│   └── index.html          # Main frontend UI (HTML)
├── static/
│   ├── css/
│   │   └── style.css       # Main CSS styles
│   ├── script/
│   │   └── script.js       # Frontend JS (optional)
│   └── outputs/            # Generated voice files
├── uploads/                # Temp audio uploads (auto-cleaned)
├── README.md               # Project documentation
```

---

## Tech Stack

- **Frontend:** HTML, CSS (Poppins, Font Awesome), JavaScript
- **Backend:** Python, Flask
- **AI Model:** AI4Bharat IndicF5 (via Hugging Face/Gradio client)
- **Audio Processing:** ffmpeg-python

---

## Contributing

We welcome contributions! To contribute:

1. Fork the repo and create your branch: `git checkout -b my-feature`
2. Commit your changes: `git commit -am 'Add new feature'`
3. Push to the branch: `git push origin my-feature`
4. Open a pull request

See the [Contributors](https://github.com/mithun50/DVCloner/graphs/contributors) section in the app for more info.

---

## License

Distributed under the MIT License. See `LICENSE` for details.

---

## Acknowledgements

- [AI4Bharat](https://ai4bharat.org/) for IndicF5 TTS/cloning model
- [Gradio](https://gradio.app/) for seamless AI API integration
- [Font Awesome](https://fontawesome.com/) for UI icons
- All contributors and testers!

---

## Contact

Created by [Mithun Gowda B](https://github.com/mithun50)

> For issues or suggestions, open an [issue](https://github.com/mithun50/DVCloner/issues) or email via GitHub profile.

---

**DesiVoiceCloner** – Bringing voice cloning to every Indian language, for everyone.

---

_**Note:** This project is for educational and experimental use only. Generated voices should not be used for impersonation or malicious purposes._

---
