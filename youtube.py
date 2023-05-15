import argparse
from moviepy.editor import *
from pydub import AudioSegment

# Setup command-line arguments
parser = argparse.ArgumentParser()
parser.add_argument("--audio", help="Path to the audio file", required=True)
parser.add_argument("--image", help="Path to the image file", required=False)
parser.add_argument("--output", help="Path to the output file", required=False)
args = parser.parse_args()

# Set defaults for image and output if they weren't provided
image = args.image if args.image is not None else 'podcasts/the-customer-daily-youtube.png'
output = args.output if args.output is not None else args.audio[:-4] + '.mp4'

# Load mp3
audio = AudioSegment.from_mp3(args.audio)
audio_duration = len(audio) / 1000  # Audio duration in seconds

# Load image
img = ImageClip(image, duration=audio_duration)

# Create a composite video clip with audio
audioclip = AudioFileClip(args.audio)
videoclip = CompositeVideoClip([img.set_duration(audioclip.duration)])
videoclip.audio = audioclip

# Write the result to a file
videoclip.write_videofile(output, codec='libx264', fps=24)
