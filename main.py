
import os
import platform
import subprocess
import sys
import shutil

def is_ffmpeg_installed():
    return shutil.which("ffmpeg") is not None

def install_ffmpeg():
    os_type = platform.system().lower()
    print(f"Detected OS: {os_type}")

    if is_ffmpeg_installed():
        print("FFmpeg already installed.")
        return

    try:
        if "linux" in os_type:
            if "termux" in os.uname().release.lower():
                print("Installing FFmpeg on Termux...")
                os.system("pkg update && pkg install -y ffmpeg")
            else:
                print("Installing FFmpeg on Linux...")
                os.system("sudo apt-get update && sudo apt-get install -y ffmpeg")
        elif "windows" in os_type:
            print("Downloading FFmpeg for Windows...")
            os.system("pip install imageio[ffmpeg]")  # Easy workaround
        elif "darwin" in os_type:
            print("Installing FFmpeg on macOS...")
            os.system("brew install ffmpeg")
        else:
            print("Unsupported OS for auto-install.")
    except Exception as e:
        print("FFmpeg installation failed:", e)

def install_requirements():
    print("Installing requirements from requirements.txt...")
    subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"], check=True)
    os.system("python app.py")

if _name_ == "_main_":
    install_ffmpeg()
    install_requirements()
    print("✅ Setup completed successfully.")
    print("✅ Runing app.py")