"""Regression coverage for YouTube material URL normalization."""

import pytest

from backend.youtube_urls import normalize_youtube_url, youtube_video_id


@pytest.mark.parametrize(
    ("url", "video_id"),
    [
        ("https://www.youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ"),
        ("https://youtu.be/dQw4w9WgXcQ?t=30", "dQw4w9WgXcQ"),
        ("https://www.youtube.com/shorts/dQw4w9WgXcQ", "dQw4w9WgXcQ"),
        ("https://www.youtube.com/embed/dQw4w9WgXcQ", "dQw4w9WgXcQ"),
        ("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ", "dQw4w9WgXcQ"),
    ],
)
def test_youtube_video_id_supports_common_share_formats(url, video_id):
    assert youtube_video_id(url) == video_id
    assert normalize_youtube_url(url) == (
        f"https://www.youtube.com/watch?v={video_id}"
    )


@pytest.mark.parametrize(
    "url",
    [
        "https://example.com/watch?v=dQw4w9WgXcQ",
        "https://www.youtube.com/playlist?list=PL123",
        "https://www.youtube.com/watch?v=invalid!",
    ],
)
def test_invalid_or_non_video_youtube_url_is_rejected(url):
    assert youtube_video_id(url) == ""
    with pytest.raises(ValueError, match="URL YouTube"):
        normalize_youtube_url(url)
