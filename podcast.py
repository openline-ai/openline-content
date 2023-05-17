from pydub import AudioSegment
from dotenv import load_dotenv
import requests
import os

load_dotenv()

def podcastIntro(speaker1_file, speaker2_file, music_file, output_file):
    # Load audio files
    speaker1 = AudioSegment.from_file(speaker1_file)
    speaker2 = AudioSegment.from_file(speaker2_file)
    music = AudioSegment.from_file(music_file)

    # Create 10 seconds and 1.5 seconds pauses
    pause_10s = AudioSegment.silent(duration=10000)  # duration in milliseconds
    pause_1_5s = AudioSegment.silent(duration=1500)
    pause_3s = AudioSegment.silent(duration=5000)  # 5 seconds pause

    # Adjust volume of speaker2 to match speaker1
    loudness_difference = speaker1.dBFS - speaker2.dBFS
    speaker2 = speaker2.apply_gain(loudness_difference)

    # Concatenate speaker files with 10 seconds pause in between and 5 seconds pause at the end
    podcast = speaker1 + pause_10s + speaker2 + pause_3s

    # Add 1.5 seconds pause before music starts
    music = pause_1_5s + music

    # Ensure the music is long enough for the podcast
    while len(music) < len(podcast):
        music += music

    # Trim the music to match the podcast length
    music = music[:len(podcast)]

    # Separate music into four parts: before fade, during fade, after the fade and final fade out
    music_before_fade = music[:8000]  # Full volume for 8 seconds
    music_during_fade = music[8000:12000]  # Fading for 4 seconds
    music_after_fade = music[12000:len(podcast) - 5000]  # The remaining part before final fade out
    music_final_fade = music[len(podcast) - 5000:]  # Final 5 seconds fade out

    # Apply fade during transition
    music_during_fade = music_during_fade.fade(to_gain=-25, start=0, duration=4000)

    # Make sure the volume of music_after_fade is at -30 dB
    music_after_fade = music_after_fade - music_after_fade.dBFS - 30

    # Fade out the music in the last 5 seconds
    music_final_fade = music_final_fade.fade_out(5000)

    # Now reduce the volume of the faded out part to match the rest of the music
    music_final_fade = music_final_fade - music_final_fade.dBFS - 30

    # Combine the four parts of the music again
    music = music_before_fade + music_during_fade + music_after_fade + music_final_fade

    # Mix audio files
    final_output = podcast.overlay(music)

    # Export final audio file
    final_output.export(output_file, format='mp3')


def getSegment(voice, text, segmentName, date):
    key = os.getenv('ELEVENLABS_API_KEY')
    print(key)
    
    if voice.lower() == 'tim':
        voiceId = 'H6F60YFlaaeFViBgQeVH'
        stability = 0.3
        clarity = 0.5
    elif voice.lower() == 'elli':
        voiceId = 'MF3mGyEYCl7XYWbV9V6O'
        stability = 0.3
        clarity = 0.5
    else:
        print("Error: Invalid voice")
        return
    
    CHUNK_SIZE = 1024
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voiceId}/stream"

    headers = {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": key
    }

    data = {
        "text": text,
        "model_id": "eleven_monolingual_v1",
        "voice_settings": {
            "stability": stability,
            "similarity_boost": clarity
        }
    }

    response = requests.post(url, json=data, headers=headers, stream=True)
    response.raise_for_status()

    directory = f'podcasts/{date}'
    os.makedirs(directory, exist_ok=True)  # create directory if it does not exist

    output = f'{directory}/{segmentName}.mp3'
    with open(output, 'wb') as f:
        for chunk in response.iter_content(chunk_size=CHUNK_SIZE):
            if chunk:
                f.write(chunk)

text = "...It's Friday, 19th of May--and this is The Customer Daily."
getSegment('elli', text, 'date-intro-elli', '19052023')
# Usage
# podcastIntro('podcasts/test/day.mp3', 'podcasts/test/intro.mp3', 'podcasts/test/intro-music.mp3', 'podcasts/test/output.mp3')
