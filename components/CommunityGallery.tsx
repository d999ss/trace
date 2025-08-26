'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RideObject } from '@/lib/types/ride';

interface GalleryPost {
  id: string;
  ride: RideObject;
  author: {
    id: string;
    name: string;
    avatar: string;
    stravaProfile?: string;
  };
  images: {
    thumbnail: string;
    full: string;
  };
  stats: {
    likes: number;
    comments: number;
    purchases: number;
  };
  featured: boolean;
  createdAt: Date;
}

interface CommunityGalleryProps {
  initialPosts?: GalleryPost[];
  onPostClick?: (post: GalleryPost) => void;
}

export function CommunityGallery({ initialPosts = [], onPostClick }: CommunityGalleryProps) {
  const [posts, setPosts] = useState<GalleryPost[]>(initialPosts);
  const [filter, setFilter] = useState<'all' | 'featured' | 'trending' | 'recent'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'masonry' | 'list'>('masonry');
  const [selectedPost, setSelectedPost] = useState<GalleryPost | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load posts
  useEffect(() => {
    const loadPostsInner = async () => {
      setIsLoading(true);
      // Simulate API call
      setTimeout(() => {
        setPosts(generateSamplePosts());
        setIsLoading(false);
      }, 500);
    };
    loadPostsInner();
  }, [filter]);

  const generateSamplePosts = (): GalleryPost[] => {
    // Generate sample gallery posts for demo
    return Array.from({ length: 12 }, (_, i) => ({
      id: `post-${i}`,
      ride: {
        id: `ride-${i}`,
        userId: `user-${i}`,
        name: ['Epic Mountain Trail', 'Century Ride', 'Coastal Adventure', 'Dawn Patrol'][i % 4],
        coordinates: [],
        metrics: {
          distance: 20 + Math.random() * 80,
          distanceUnit: 'mi' as const,
          duration: 3600 + Math.random() * 7200,
          elevationGain: 500 + Math.random() * 3000,
          elevationUnit: 'ft' as const,
          averageSpeed: 12 + Math.random() * 8,
          maxSpeed: 25 + Math.random() * 15,
        },
        context: {
          type: (['mountain', 'road', 'trail', 'urban'][i % 4]) as 'mountain' | 'urban' | 'trail' | 'road',
          time: {
            startTime: new Date(),
            endTime: new Date(),
            dayPeriod: (['dawn', 'morning', 'afternoon', 'evening'][i % 4]) as 'dawn' | 'morning' | 'afternoon' | 'evening',
          },
          location: {
            country: 'USA',
            city: ['San Francisco', 'Boulder', 'Portland', 'Austin'][i % 4],
          },
        },
        style: {
          theme: (['minimal', 'mountain', 'urban', 'neon'][i % 4]) as 'light' | 'dark' | 'accent' | 'mountain' | 'urban' | 'minimal' | 'retro' | 'brutalist' | 'neon',
          posterStyle: 'art-print' as const,
          colorScheme: {
            primary: '#000000',
            secondary: '#666666',
            accent: '#0066FF',
            background: '#FFFFFF',
            foreground: '#000000',
            route: '#0066FF',
          },
          typography: {
            titleFont: 'Helvetica Neue, sans-serif',
            subtitleFont: 'Helvetica Neue, sans-serif',
            metricsFont: 'SF Mono, monospace',
          },
          layout: {
            ratio: '2:3',
            orientation: 'portrait',
            margins: 100,
            padding: 60,
          },
        },
        customizations: {
          title: ['Epic Mountain Trail', 'Century Ride', 'Coastal Adventure', 'Dawn Patrol'][i % 4],
          subtitle: `${(20 + Math.random() * 80).toFixed(1)} mi adventure`,
          showMetrics: true,
          showElevationProfile: false,
          showMilestones: false,
        },
        product: {
          sku: `SKU-${i}`,
          title: 'Premium Poster',
          description: '',
          price: { amount: 49.99, currency: 'USD' },
          sizes: [],
          finishes: [],
          frames: [],
        },
        fulfillment: {
          printProvider: 'printful',
          printSpecs: { dpi: 300, colorSpace: 'RGB', bleed: 3, format: 'PDF' },
          shippingOptions: [],
          productionTime: 3,
        },
        marketing: {
          headline: 'Epic ride captured forever',
          story: '',
          achievement: '',
          milestones: [],
          hashtags: [],
          socialShareText: '',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        visibility: 'public',
      },
      author: {
        id: `author-${i}`,
        name: ['Alex Rivera', 'Sarah Chen', 'Mike Johnson', 'Emma Wilson'][i % 4],
        avatar: `/avatars/avatar-${(i % 4) + 1}.jpg`,
        stravaProfile: `https://strava.com/athletes/${i}`,
      },
      images: {
        thumbnail: `/gallery/thumb-${i}.jpg`,
        full: `/gallery/full-${i}.jpg`,
      },
      stats: {
        likes: Math.floor(Math.random() * 500),
        comments: Math.floor(Math.random() * 50),
        purchases: Math.floor(Math.random() * 20),
      },
      featured: i % 3 === 0,
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    }));
  };

  const handleLike = (postId: string) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, stats: { ...post.stats, likes: post.stats.likes + 1 }}
        : post
    ));
  };

  const handleShare = async (post: GalleryPost) => {
    const shareData = {
      title: post.ride.customizations.title,
      text: `Check out this amazing ${post.ride.metrics.distance.toFixed(1)} ${post.ride.metrics.distanceUnit} ride!`,
      url: `https://printmyride.com/gallery/${post.id}`,
    };

    if (navigator.share) {
      await navigator.share(shareData);
    } else {
      // Fallback to copying link
      navigator.clipboard.writeText(shareData.url);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Community Gallery</h1>
            
            {/* Filters */}
            <div className="flex items-center gap-4">
              <div className="flex bg-gray-100 rounded-lg p-1">
                {(['all', 'featured', 'trending', 'recent'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-2 rounded-md capitalize transition-colors ${
                      filter === f 
                        ? 'bg-white text-black shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
              
              {/* View Mode */}
              <div className="flex gap-2">
                {(['grid', 'masonry', 'list'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`p-2 rounded ${
                      viewMode === mode ? 'bg-gray-200' : 'hover:bg-gray-100'
                    }`}
                    title={mode}
                  >
                    {mode === 'grid' && '⊞'}
                    {mode === 'masonry' && '⊟'}
                    {mode === 'list' && '☰'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <motion.div 
            className={`
              ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : ''}
              ${viewMode === 'masonry' ? 'columns-1 md:columns-2 lg:columns-3 gap-6' : ''}
              ${viewMode === 'list' ? 'space-y-4' : ''}
            `}
            layout
          >
            <AnimatePresence>
              {posts.map((post, index) => (
                <motion.div
                  key={post.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className={`
                    bg-white rounded-lg shadow-md overflow-hidden cursor-pointer
                    hover:shadow-xl transition-shadow
                    ${viewMode === 'masonry' ? 'break-inside-avoid mb-6' : ''}
                    ${viewMode === 'list' ? 'flex' : ''}
                  `}
                  onClick={() => {
                    setSelectedPost(post);
                    onPostClick?.(post);
                  }}
                >
                  {/* Poster Preview */}
                  <div className={`relative ${viewMode === 'list' ? 'w-48' : ''}`}>
                    <div 
                      className={`
                        bg-gradient-to-br from-blue-400 to-purple-600
                        ${viewMode === 'list' ? 'h-32' : 'aspect-[2/3]'}
                      `}
                    >
                      {/* Placeholder for actual poster image */}
                      <div className="absolute inset-0 flex items-center justify-center text-white">
                        <span className="text-4xl">🚴</span>
                      </div>
                    </div>
                    
                    {post.featured && (
                      <div className="absolute top-2 left-2 bg-yellow-400 text-gray-900 px-2 py-1 rounded-full text-xs font-bold">
                        FEATURED
                      </div>
                    )}
                  </div>

                  {/* Post Details */}
                  <div className="p-4 flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-lg">{post.ride.customizations.title}</h3>
                        <p className="text-sm text-gray-600">
                          {post.ride.metrics.distance.toFixed(1)} {post.ride.metrics.distanceUnit} • 
                          {post.ride.metrics.elevationGain.toLocaleString()} {post.ride.metrics.elevationUnit} elevation
                        </p>
                      </div>
                    </div>

                    {/* Author */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                      <span className="text-sm font-medium">{post.author.name}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLike(post.id);
                          }}
                          className="flex items-center gap-1 text-sm text-gray-600 hover:text-red-500 transition-colors"
                        >
                          <span>❤️</span>
                          <span>{post.stats.likes}</span>
                        </button>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <span>💬</span>
                          <span>{post.stats.comments}</span>
                        </div>
                        {post.stats.purchases > 0 && (
                          <div className="flex items-center gap-1 text-sm text-green-600">
                            <span>🛒</span>
                            <span>{post.stats.purchases} sold</span>
                          </div>
                        )}
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShare(post);
                        }}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Post Detail Modal */}
      <AnimatePresence>
        {selectedPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedPost(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal content would go here */}
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-4">{selectedPost.ride.customizations.title}</h2>
                <p>Full poster details and purchase options...</p>
                <button
                  onClick={() => setSelectedPost(null)}
                  className="mt-4 px-6 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}