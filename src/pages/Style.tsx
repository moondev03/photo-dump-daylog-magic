
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { storage } from "@/utils/storage";
import { DaylogEvent } from "@/types";

type LayoutType = 'grid' | 'masonry' | 'collage' | 'minimal';

const Style = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const eventId = searchParams.get('eventId');
  
  const [event, setEvent] = useState<DaylogEvent | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [dumpTitle, setDumpTitle] = useState("");
  const [dumpMemo, setDumpMemo] = useState("");
  const [showTitle, setShowTitle] = useState(false);
  const [showMemo, setShowMemo] = useState(false);
  
  const [selectedLayout, setSelectedLayout] = useState<LayoutType>('grid');
  const [selectedBgColor, setSelectedBgColor] = useState('#fefefe');

  const layouts = [
    {
      id: 'grid' as LayoutType,
      name: '그리드형',
      description: '정렬된 격자 형태',
      emoji: '⚏'
    },
    {
      id: 'masonry' as LayoutType,
      name: '메이슨리형',
      description: '자연스러운 벽돌 쌓기',
      emoji: '🧱'
    },
    {
      id: 'collage' as LayoutType,
      name: '콜라주형',
      description: '자유로운 배치',
      emoji: '🎨'
    },
    {
      id: 'minimal' as LayoutType,
      name: '미니멀형',
      description: '단순하고 깔끔하게',
      emoji: '✨'
    }
  ];

  const backgroundColors = [
    { name: '화이트', color: '#fefefe' },
    { name: '크림', color: '#fef7ed' },
    { name: '베이지', color: '#f5f5dc' },
    { name: '라이트 그레이', color: '#f8f9fa' },
    { name: '웜 화이트', color: '#fffcf7' },
    { name: '소프트 핑크', color: '#fef2f2' }
  ];

  useEffect(() => {
    if (eventId) {
      const foundEvent = storage.getScheduleById(eventId);
      if (foundEvent) {
        setEvent(foundEvent);
        const eventPhotos = storage.getPhotos(eventId);
        setPhotos(eventPhotos);
        
        // Load data from preview page
        const title = sessionStorage.getItem('dumpTitle') || '';
        const memo = sessionStorage.getItem('dumpMemo') || '';
        const showTitleStr = sessionStorage.getItem('showTitle') || 'false';
        const showMemoStr = sessionStorage.getItem('showMemo') || 'false';
        
        setDumpTitle(title);
        setDumpMemo(memo);
        setShowTitle(showTitleStr === 'true');
        setShowMemo(showMemoStr === 'true');
        
        if (eventPhotos.length === 0) {
          navigate(`/preview?eventId=${eventId}`);
        }
      } else {
        navigate('/calendar');
      }
    }
  }, [eventId, navigate]);

  const createPhotoDump = () => {
    if (!event) return;
    
    const dump = {
      id: Date.now().toString(),
      eventId: eventId!,
      title: showTitle ? dumpTitle : '',
      memo: showMemo ? dumpMemo : '',
      showTitle,
      showMemo,
      style: {
        layout: selectedLayout,
        backgroundColor: selectedBgColor,
        fontFamily: 'Inter'
      },
      createdAt: new Date().toISOString()
    };
    
    storage.saveDump(dump);
    
    // Clear session data
    sessionStorage.removeItem('dumpTitle');
    sessionStorage.removeItem('dumpMemo');
    sessionStorage.removeItem('showTitle');
    sessionStorage.removeItem('showMemo');
    
    navigate(`/result?eventId=${eventId}`);
  };

  const renderPreview = () => {
    const containerStyle = {
      backgroundColor: selectedBgColor
    };

    return (
      <div className="bg-white rounded-2xl p-6 shadow-inner border max-h-96 overflow-y-auto" style={containerStyle}>
        {showTitle && dumpTitle && (
          <h3 className="text-xl font-bold text-center mb-4 text-gray-800">
            {dumpTitle}
          </h3>
        )}

        {photos.length > 0 && (
          <div className={`mb-4 ${
            selectedLayout === 'grid' 
              ? 'grid grid-cols-2 gap-2' 
              : selectedLayout === 'masonry'
                ? 'columns-2 gap-2 space-y-2'
                : selectedLayout === 'collage'
                  ? 'grid grid-cols-2 gap-1'
                  : 'space-y-3'
          }`}>
            {photos.slice(0, 4).map((photo, index) => (
              <div 
                key={index} 
                className={`overflow-hidden ${
                  selectedLayout === 'grid' 
                    ? 'aspect-square rounded-md' 
                    : selectedLayout === 'masonry'
                      ? `${index % 2 === 0 ? 'aspect-[3/4]' : 'aspect-square'} rounded-md break-inside-avoid`
                      : selectedLayout === 'collage'
                        ? `${index === 0 ? 'col-span-2 aspect-[2/1]' : 'aspect-square'} rounded-md`
                        : 'aspect-[4/3] rounded-lg'
                }`}
              >
                <img
                  src={photo}
                  alt={`Photo ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        )}

        {showMemo && dumpMemo && (
          <p className="text-center text-sm text-gray-600 italic border-t pt-3">
            "{dumpMemo}"
          </p>
        )}
      </div>
    );
  };

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-sunset/20 to-peach/20 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-muted-foreground">일정 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-sunset/20 to-peach/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Link to="/" className="inline-block mb-6">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-peach to-sunset bg-clip-text text-transparent">
              Daylog
            </h1>
          </Link>
          <h2 className="text-3xl font-bold text-foreground mb-4">
            🎨 스타일 설정
          </h2>
          <p className="text-muted-foreground text-lg">
            포토 덤프의 레이아웃과 색상을 선택해보세요
          </p>
        </div>

        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8">
          {/* Settings */}
          <div className="space-y-8">
            {/* Layout Selection */}
            <Card className="glass-effect border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="text-xl font-bold">레이아웃 선택</span>
                  <Link to={`/preview?eventId=${eventId}`}>
                    <Button variant="ghost" size="sm">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      미리보기로 돌아가기
                    </Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4">
                  {layouts.map(layout => (
                    <button
                      key={layout.id}
                      onClick={() => setSelectedLayout(layout.id)}
                      className={`p-4 rounded-xl border-2 text-left transition-all duration-200 hover:scale-105 ${
                        selectedLayout === layout.id 
                          ? 'border-peach bg-peach/20' 
                          : 'border-border hover:border-peach/50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">{layout.emoji}</div>
                        <div>
                          <h4 className="font-semibold">{layout.name}</h4>
                          <p className="text-sm text-muted-foreground">{layout.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Background Color */}
            <Card className="glass-effect border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-bold">배경색 선택</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {backgroundColors.map(bg => (
                    <button
                      key={bg.color}
                      onClick={() => setSelectedBgColor(bg.color)}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
                        selectedBgColor === bg.color 
                          ? 'border-peach ring-2 ring-peach/30' 
                          : 'border-border hover:border-peach/50'
                      }`}
                      style={{ backgroundColor: bg.color }}
                    >
                      <div className="text-sm font-medium text-gray-800">{bg.name}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview */}
          <div className="lg:sticky lg:top-8">
            <Card className="glass-effect border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-bold">실시간 미리보기</CardTitle>
              </CardHeader>
              <CardContent>
                {renderPreview()}
              </CardContent>
            </Card>

            {/* Action Button */}
            <div className="mt-6 text-center">
              <Button
                onClick={createPhotoDump}
                size="lg"
                className="gradient-peach text-white border-0 px-8 py-4 text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 w-full"
              >
                <ArrowRight className="mr-2 h-5 w-5" />
                ✨ 포토 덤프 생성하기
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Style;
