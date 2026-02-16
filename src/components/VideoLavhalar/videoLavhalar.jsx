import React, { useState, useEffect, useCallback } from 'react';
import './VideoLavhalar.scss';
import { useLanguage } from '../../context/LanguageContext';

const VideoLavhalar = () => {
  const { language, translations } = useLanguage();
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Backendan videolarni olish
  useEffect(() => {
    fetchVideos();
  }, [language]);

  // YouTube video ID ni URL dan ajratib olish
  const extractYouTubeId = (url) => {
    if (!url) return null;
    
    // Agar to'liq iframe kodi bo'lsa
    const embedMatch = url.match(/embed\/([^?"]+)/);
    if (embedMatch) return embedMatch[1];
    
    // Agar youtube.com/watch?v= formatida bo'lsa
    const watchMatch = url.match(/v=([^&]+)/);
    if (watchMatch) return watchMatch[1];
    
    // Agar youtu.be formatida bo'lsa
    const shortMatch = url.match(/youtu\.be\/([^?]+)/);
    if (shortMatch) return shortMatch[1];
    
    return null;
  };

  // YouTube iframe yaratish
  const createYouTubeIframe = (videoId, title) => {
    return (
      <iframe
        width="100%"
        height="100%"
        src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&autoplay=1`}
        title={title}
        frameBorder="0"
        allow="accelerometer;  clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      ></iframe>
    );
  };

  // API chaqiruvi
  const fetchVideos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`https://uzbwomen.dev-platform.uz/api/videos/?format=json&lang=${language}`);

      if (!response.ok) {
        throw new Error(`HTTP xato! Status: ${response.status}`);
      }

      const data = await response.json();
      const videosData = data.results || data;

      // Ma'lumotlarni qayta ishlash
      const processedVideos = videosData.map(video => {
        // YouTube ID ni ajratib olish
        const youtubeId = extractYouTubeId(video.youtube_url) || video.youtube_id;
        
        // Thumbnail yaratish
        const thumbnail = youtubeId 
          ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`
          : video.thumbnail;
        
        // Agar to'liq iframe kodi bo'lsa, uni alohida saqlash
        const hasFullIframe = video.youtube_url && video.youtube_url.includes('<iframe');
        
        return {
          id: video.id,
          title: video.title,
          description: video.description || '',
          youtube_id: youtubeId,
          youtube_url: video.youtube_url,
          hasFullIframe: hasFullIframe,
          thumbnail: thumbnail,
          // views_count: video.views_count || video.views || 0,
          // likes_count: video.likes_count || video.likes || 0,
          duration: video.duration || "00:00",
          created_at: video.created_at
        };
      });

      setVideos(processedVideos);
      if (processedVideos.length > 0) {
        setSelectedVideo(processedVideos[0]);
      }
    } catch (error) {
      console.error('Videolarni yuklashda xatolik:', error);
      setError(error.message);
      // Demo ma'lumotlar
      setVideos(generateDemoVideos(language));
      setSelectedVideo(generateDemoVideos(language)[0]);
    } finally {
      setLoading(false);
    }
  }, [language]);

  // Video tanlash funksiyasi
  const handleSelectVideo = (video) => {
    setSelectedVideo(video);
    // Ko'rishlar sonini oshirish
    incrementViews(video.id);
  };

  // Ko'rishlar sonini oshirish
  const incrementViews = async (videoId) => {
    try {
      const response = await fetch(`https://uzbwomen.dev-platform.uz/api/videos/${videoId}/increment_views/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        // Videolarni yangilash
        setVideos(prevVideos =>
          prevVideos.map(video =>
            video.id === videoId
              ? { ...video, views_count: (video.views_count || 0) + 1 }
              : video
          )
        );
        
        if (selectedVideo?.id === videoId) {
          setSelectedVideo(prev => ({ 
            ...prev, 
            views_count: (prev.views_count || 0) + 1 
          }));
        }
      }
    } catch (error) {
      console.error('Ko\'rishlar sonini oshirishda xato:', error);
    }
  };

  // Layklar sonini oshirish
  const incrementLikes = async (videoId) => {
    try {
      const response = await fetch(`https://uzbwomen.dev-platform.uz/api/videos/${videoId}/increment_likes/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Yangilangan layklar soni bilan videoni yangilash
        setVideos(prevVideos =>
          prevVideos.map(video =>
            video.id === videoId
              ? { ...video, likes_count: data.likes_count || data.likes || (video.likes_count || 0) + 1 }
              : video
          )
        );
        
        if (selectedVideo?.id === videoId) {
          setSelectedVideo(prev => ({ 
            ...prev, 
            likes_count: data.likes_count || data.likes || (prev.likes_count || 0) + 1 
          }));
        }
      }
    } catch (error) {
      console.error('Layklar sonini oshirishda xato:', error);
    }
  };

  // YouTube videoni render qilish
  const renderYouTubeVideo = (video) => {
    if (!video) return null;
    
    if (video.hasFullIframe && video.youtube_url) {
      // Agar to'liq iframe kodi bo'lsa
      return (
        <div 
          className="video-iframe-wrapper"
          dangerouslySetInnerHTML={{ __html: video.youtube_url }}
        />
      );
    } else if (video.youtube_id) {
      // Agar faqat youtube_id bo'lsa
      return createYouTubeIframe(video.youtube_id, video.title);
    }
    
    return (
      <div className="no-video-available">
        <p>Video mavjud emas</p>
      </div>
    );
  };

  // Demo ma'lumotlar yaratish
  const generateDemoVideos = (lang) => {
    const videosData = {
      uz: [
        {
          id: 1,
          title: "Rözgöriga banka | 32 yıllık likuvchi tadbirkor aydı",
          youtube_id: "Gx9omp9mUdI",
          youtube_url: "https://www.youtube.com/embed/Gx9omp9mUdI",
          description: "32 yillik tajribaga ega tadbirkorning bank sohasidagi tajribalari",
          duration: "15:42",
          views_count: 12500,
          likes_count: 850,
          thumbnail: "https://img.youtube.com/vi/Gx9omp9mUdI/hqdefault.jpg"
        },
        {
          id: 2,
          title: "Ayollar tadbirkorligini rivojlantirish",
          youtube_id: "dQw4w9WgXcQ",
          youtube_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
          description: "Ayollar tadbirkorligini rivojlantirish bo'yicha maslahatlar",
          duration: "22:18",
          views_count: 8900,
          likes_count: 720,
          thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg"
        },
      ],
      ru: [
        {
          id: 1,
          title: "Бизнес в банковской сфере | Опыт предпринимателя с 32-летним стажем",
          youtube_id: "Gx9omp9mUdI",
          youtube_url: "https://www.youtube.com/embed/Gx9omp9mUdI",
          description: "Опыт предпринимателя с 32-летним стажем в банковской сфере",
          duration: "15:42",
          views_count: 12500,
          likes_count: 850,
          thumbnail: "https://img.youtube.com/vi/Gx9omp9mUdI/hqdefault.jpg"
        },
        {
          id: 2,
          title: "Развитие женского предпринимательства",
          youtube_id: "dQw4w9WgXcQ",
          youtube_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
          description: "Советы по развитию женского предпринимательства",
          duration: "22:18",
          views_count: 8900,
          likes_count: 720,
          thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg"
        },
      ],
      en: [
        {
          id: 1,
          title: "Business in Banking | 32 Years of Entrepreneur Experience",
          youtube_id: "Gx9omp9mUdI",
          youtube_url: "https://www.youtube.com/embed/Gx9omp9mUdI",
          description: "Experience of an entrepreneur with 32 years in banking sector",
          duration: "15:42",
          views_count: 12500,
          likes_count: 850,
          thumbnail: "https://img.youtube.com/vi/Gx9omp9mUdI/hqdefault.jpg"
        },
        {
          id: 2,
          title: "Development of Women's Entrepreneurship",
          youtube_id: "dQw4w9WgXcQ",
          youtube_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
          description: "Advice on developing women's entrepreneurship",
          duration: "22:18",
          views_count: 8900,
          likes_count: 720,
          thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg"
        },
      ]
    };

    return videosData[lang] || videosData.uz;
  };

  // Tilga qarab matnlar
  const getTranslatedTexts = () => {
    const texts = {
      uz: {
        title: "Video Lavhalar",
        loading: "Video yuklanmoqda...",
        noVideo: "Video tanlang",
        playlist: "Playlist",
        watchOnYouTube: "YouTube'da ko'rish",
        views: "ko'rish",
        likes: "layk",
        duration: "davomiylik",
        selectVideo: "Video tanlash",
        allVideos: "Barcha videolar",
        videoCount: "ta video",
        reload: "Qayta yuklash",
        error: "Xatolik yuz berdi"
      },
      ru: {
        title: "Видео материалы",
        loading: "Видео загружается...",
        noVideo: "Выберите видео",
        playlist: "Плейлист",
        watchOnYouTube: "Смотреть на YouTube",
        views: "просмотров",
        likes: "лайков",
        duration: "продолжительность",
        selectVideo: "Выбрать видео",
        allVideos: "Все видео",
        videoCount: "видео",
        reload: "Перезагрузить",
        error: "Произошла ошибка"
      },
      en: {
        title: "Video Materials",
        loading: "Loading video...",
        noVideo: "Select a video",
        playlist: "Playlist",
        watchOnYouTube: "Watch on YouTube",
        views: "views",
        likes: "likes",
        duration: "duration",
        selectVideo: "Select video",
        allVideos: "All videos",
        videoCount: "videos",
        reload: "Reload",
        error: "An error occurred"
      }
    };

    return texts[language] || texts.uz;
  };

  const t = getTranslatedTexts();

  if (loading) {
    return (
      <div className="video-loading" id="video-lavhalar">
        <div className="loading-spinner"></div>
        <p>{t.loading}</p>
      </div>
    );
  }

  return (
    <div className="video-lavhalar-container" id="video-lavhalar">
      <header className="video-header">
        <h1>{t.title}</h1>
        <div className="video-count">
          {videos.length} {t.videoCount}
        </div>
      </header>

      {error && (
        <div className="video-error">
          <p>{t.error}: {error}</p>
          <button onClick={fetchVideos}>{t.reload}</button>
        </div>
      )}

      <div className="video-content">
        {/* Videolar ro'yxati */}
        <div className="video-sidebar">
          <div className="playlist-header">
            <h2>{t.playlist}</h2>
            <div className="playlist-count">
              {videos.length} {t.videoCount}
            </div>
          </div>

          <ul className="video-list">
            {videos.map((video) => (
              <li
                key={video.id}
                className={`video-item ${
                  selectedVideo?.id === video.id ? "active" : ""
                }`}
                onClick={() => handleSelectVideo(video)}
              >
                <div className="video-item-thumbnail">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://img.youtube.com/vi/${video.youtube_id}/hqdefault.jpg`;
                    }}
                  />
                  <div className="video-item-duration">{video.duration}</div>
                </div>
                <div className="video-item-content">
                  <h3>{video.title}</h3>
                  {/* <div className="video-item-meta">
                    <span className="views">
                      👁️ {video.views_count} {t.views}
                    </span>
                    <span className="likes">
                      ❤️ {video.likes_count} {t.likes}
                    </span>
                  </div> */}
                </div>
              </li>
            ))}
          </ul>

          <div className="youtube-link">
            <a
              href="https://www.youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              className="youtube-btn"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="red"
                style={{ marginRight: "8px" }}
              >
                <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
              </svg>
              <span>{t.watchOnYouTube}</span>
            </a>
          </div>
        </div>

        {/* Tanlangan video */}
        <div className="video-main">
          {selectedVideo ? (
            <>
              <div className="video-player">
                <div className="video-iframe-container">
                  {renderYouTubeVideo(selectedVideo)}
                </div>
              </div>

              <div className="video-info">
                <h2>{selectedVideo.title}</h2>

                <div className="video-stats">
                  {/* <span className="video-stat">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" />
                      <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" />
                    </svg>
                    {selectedVideo.views_count} {t.views}
                  </span> */}
{/* 
                  <span className="video-stat">
                    <button
                      className="like-btn"
                      onClick={() => incrementLikes(selectedVideo.id)}
                      aria-label="Like video"
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill={
                          selectedVideo.likes_count > 0 ? "#ff4757" : "none"
                        }
                        stroke="#ff4757"
                        strokeWidth="2"
                      >
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg> */}
                      {/* {selectedVideo.likes_count} {t.likes} */}
                    {/* </button>
                  </span> */}

                  <span className="video-stat">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" />
                      <path d="M12 6V12L16 14" />
                    </svg>
                    {selectedVideo.duration}
                  </span>

                  <a
                    href={
                      selectedVideo.youtube_url ||
                      `https://www.youtube.com/watch?v=${selectedVideo.youtube_id}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="video-stat youtube-link-btn"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="red"
                      style={{ marginRight: "4px" }}
                    >
                      <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                    </svg>
                    {t.watchOnYouTube}
                  </a>
                </div>

                <p className="video-description">{selectedVideo.description}</p>
              </div>
            </>
          ) : (
            <div className="no-video">
              <div className="no-video-icon">
                <svg
                  width="60"
                  height="60"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M23 7L16 12L23 17V7Z" />
                  <path d="M14 5H3C1.89543 5 1 5.89543 1 7V17C1 18.1046 1.89543 19 3 19H14C15.1046 19 16 18.1046 16 17V7C16 5.89543 15.1046 5 14 5Z" />
                </svg>
              </div>
              <p>{t.selectVideo}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoLavhalar;