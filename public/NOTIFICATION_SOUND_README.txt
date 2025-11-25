NOTIFICATION SOUND SETUP
========================

The EMR system includes audio notifications that play when new notifications arrive.

CURRENT BEHAVIOR:
-----------------
The system currently uses a Web Audio API-generated three-tone sound (similar to iPhone's 
tri-tone) as a fallback. This provides a loud, pleasant notification sound without requiring 
any external files. Volume is set to 90% for maximum audibility.

ADDING A CUSTOM NOTIFICATION SOUND:
------------------------------------
To replace the fallback sound with your own audio file:

1. Obtain a notification sound file (recommended formats: .mp3, .wav, or .ogg)
   - Keep it short (0.5-2 seconds recommended)
   - Keep the volume moderate (the system sets playback at 90% volume)
   - Choose a pleasant, audible sound

2. Name the file: notification-sound.mp3 (or .wav/.ogg)

3. Place the file in the /public folder (same directory as this README)

4. The system will automatically use your custom sound file when available

RECOMMENDED FREE SOUND SOURCES:
-------------------------------
For iPhone Tri-Tone Sound (Recommended):
- mp3-ringtone.com: https://mp3-ringtone.com/download/iphone-tri-tone
- Toneswall: https://www.toneswall.com/ringtones/notification-sounds/iphone-tri-tone-notification-sound-167
- RingtoneDownloadMP3: https://ringtonedownloadmp3.net/iphone-tri-tone/

Other Free Sound Effects:
- Freesound.org: https://freesound.org/ (search for "notification" or "bell")
- Zapsplat.com: https://www.zapsplat.com/ (free sound effects)
- Mixkit.co: https://mixkit.co/free-sound-effects/notification/

TECHNICAL DETAILS:
------------------
- File path expected: /public/notification-sound.mp3
- Volume: Automatically set to 90% (very loud and noticeable)
- Fallback: Web Audio API synthesized iPhone-style tri-tone if file not found
- The fallback sound uses three ascending tones (E6, G6, A6) similar to iPhone
- Browser support: Handles autoplay policies with graceful fallback
- Each notification plays the sound only once (no repeats)
