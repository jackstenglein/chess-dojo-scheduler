from moviepy import VideoFileClip, concatenate_videoclips

intro_video_path = '/Users/jackstenglein/Downloads/short_intro.mp4'
original_video_path = '/Users/jackstenglein/Downloads/clash_of_calculators.mp4'
ad_video_path = '/Users/jackstenglein/Downloads/quick_time_out.mp4'
output_path = '/Users/jackstenglein/Downloads/output.mp4'

intro_clip = VideoFileClip(intro_video_path)
original_clip = VideoFileClip(original_video_path)
ad_clip = VideoFileClip(ad_video_path).subclipped(0, 18)

clip_before_splice = original_clip.subclipped(0, 5)
clip_after_splice = original_clip.subclipped(5, 10)

final_clip = concatenate_videoclips([intro_clip, clip_before_splice, ad_clip, clip_after_splice], method='compose')
final_clip.write_videofile(output_path, audio_codec='aac')
