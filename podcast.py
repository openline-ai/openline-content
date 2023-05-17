from pydub import AudioSegment
from dotenv import load_dotenv
import requests
import os
import argparse

load_dotenv()

def generate_segment():
    voice = input('Which voice? (Tim or Elli): ')
    segment_name = input('Segment name: ')
    date = input('Episode date: ')
    text = input('Enter the script: ')
    
    key = os.getenv('ELEVENLABS_API_KEY')
    
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

    output = f'{directory}/{segment_name}.mp3'
    with open(output, 'wb') as f:
        for chunk in response.iter_content(chunk_size=CHUNK_SIZE):
            if chunk:
                f.write(chunk)

def produce_intro(speaker1_file, speaker2_file, music_file, episode_date):
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
    output = f'podcasts/{episode_date}/episode/intro.mp3'
    final_output.export(output, format='mp3')
    print('Generated', output)
    return output

def produce_outro(outro_file, music_file, episode_date):
        # Load audio files
    speaker1 = AudioSegment.from_file(outro_file)
    music = AudioSegment.from_file(music_file)

    # Create 10 seconds and 1.5 seconds pauses
    pause_beg = AudioSegment.silent(duration=10000)  # duration in milliseconds
    pause_end = AudioSegment.silent(duration=5000)  # 5 seconds pause

    # Concatenate speaker files with 10 seconds pause in between and 5 seconds pause at the end
    podcast = pause_beg + speaker1 + pause_end

    # Ensure the music is long enough for the podcast
    while len(music) < len(podcast):
        music += music

    # Trim the music to match the podcast length
    music = music[:len(podcast)]

    # Separate music into four parts: before fade, during fade, after the fade and final fade out
    music_before_fade = music[:8000]  # Full volume for 8 seconds
    music_during_fade = music[8000:10000]  # Fading for 4 seconds
    music_after_fade = music[10000:len(podcast) - 5000]  # The remaining part before final fade out
    music_final_fade = music[len(podcast) - 5000:]  # Final 5 seconds fade out

    # Apply fade during transition
    music_during_fade = music_during_fade.fade(to_gain=-25, start=0, duration=2000)

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
    output = f'podcasts/{episode_date}/episode/outro.mp3'
    final_output.export(output, format='mp3')
    print('Generated', output)
    return output

def produce_segments(segment_files, transition_music_file, date):
    # Load the transition music
    transition_music = AudioSegment.from_file(transition_music_file)

    # Create a silence segment for the 1-second gap between segments
    silence = AudioSegment.silent(duration=1000)

    # Initialize the final output as an empty segment
    final_output = AudioSegment.empty()

    # Initialize the reference loudness using the first segment
    reference_loudness = AudioSegment.from_file(segment_files[0]).dBFS

    # Iterate over each segment file
    for i, segment_file in enumerate(segment_files):
        # Load the segment file
        segment = AudioSegment.from_file(segment_file)

        # Calculate the gain adjustment based on the difference in loudness from the reference segment
        loudness_difference = reference_loudness - segment.dBFS
        adjusted_segment = segment.apply_gain(loudness_difference)

        # Append the adjusted segment to the final output
        final_output += adjusted_segment

        # Add the transition music (with fade-out) after the segment (except for the last segment)
        if i < len(segment_files) - 1:
            transition_music_with_fade = transition_music[:3000].fade_out(1000)
            final_output += transition_music_with_fade

        # Add a 1-second gap between segments (except for the last segment)
        if i < len(segment_files) - 1:
            final_output += silence

    # Export the final output to the specified output file
    output_file = f'podcasts/{date}/episode/segments.mp3'
    final_output.export(output_file, format='mp3')
    print('Generated', output_file)
    return output_file

def combine_audio_files(intro_file, segments_file, outro_file, date):
    # Load the audio files
    intro = AudioSegment.from_file(intro_file)
    segments = AudioSegment.from_file(segments_file)
    outro = AudioSegment.from_file(outro_file)

    # Combine the audio segments
    combined_audio = intro + segments + outro

    # Normalize the volume
    normalized_audio = combined_audio.normalize()

    # Export the final audio to the output file
    output_file = f'podcasts/{date}/episode/the-customer-daily-{date}.mp3'
    normalized_audio.export(output_file, format='mp3')
    print('Generated', output_file)

def produce_episode():
    date = input('Episode date: ')
    directory = f'podcasts/{date}'
    episode = directory + '/episode'
    os.makedirs(episode, exist_ok=True)  # create directory if it does not exist

    theme_music = 'podcasts/the-customer-daily-theme-music.mp3'
    transition = 'podcasts/the-customer-daily-transition-music.wav'
    segments = [directory + '/tim-1.mp3', directory + '/elli-1.mp3', directory + '/tim-2.mp3', directory + '/elli-2.mp3']

    intro_file = produce_intro(f'{directory}/date-intro.mp3', f'{directory}/elli-intro.mp3', theme_music, date)
    segments_file = produce_segments(segments, transition, date)
    outro_file = produce_outro(directory + '/tim-outro.mp3', theme_music, date)

    combine_audio_files(intro_file, segments_file, outro_file, date)

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument("--segment", action="store_true", help="Generate a segment")
    parser.add_argument("--production", action="store_true", help="Produce an episode")
    args = parser.parse_args()

    if args.segment:
        generate_segment()
    elif args.production:
        produce_episode()
    else:
        print("No action selected. Please use either --segment or --production flag.")