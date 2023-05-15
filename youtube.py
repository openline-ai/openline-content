import argparse
from moviepy.editor import *
from pydub import AudioSegment

# Setup command-line arguments
parser = argparse.ArgumentParser()
parser.add_argument("--audio", help="Path to the audio file", required=True)
parser.add_argument("--image", help="Path to the image file", required=True)
parser.add_argument("--output", help="Path to the output file", required=True)
# parser.add_argument("--subtitles", help="Path to the subtitle file", required=False)
args = parser.parse_args()

# Load mp3
audio = AudioSegment.from_mp3(args.audio)
audio_duration = len(audio) / 1000  # Audio duration in seconds

# Load image
img = ImageClip(args.image, duration=audio_duration)

# Set the audio of the image clip
videoclip = img.set_audio(AudioFileClip(args.audio))

# Write the result to a file
videoclip.write_videofile(args.output, codec='libx264', fps=24)
