
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { storage } from "@/utils/storage";
import { DaylogEvent } from "@/types";

type LayoutType = 'timeline' | 'gallery' | 'polaroid';

const Style = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const eventId = searchParams.get('eventId');
  
  const [event, setEvent] = useState<DaylogEvent | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [dumpTitle, setDumpTitle] = useState("");
  const [dumpMemo, setDumpMemo] = useState("");
  
  const [selectedLayout, setSelectedLayout] = useState<LayoutType>('gallery');
  const [selectedBgColor, setSelectedBgColor] = useState('#ffffff');
  const [selectedFont, setSelectedFont] = useState('Inter');

  const layouts = [
    {
      id: 'timeline' as LayoutType,
      name: '타임라인형',
      description: '시간 순서대로 세로로 정렬',
      emoji: '📝'
    },
    {
      id: 'gallery' as LayoutType,
      name: '갤러리형',
      description: '그리드 형태로 깔끔하게',
      emoji: '🖼️'
    },
    {
      id: 'polaroid' as LayoutType,
      name: '폴라로이드형',
      description: '빈티지한 폴라로이드 스타일',
      emoji: '📸'
    }
  ];

  const backgroundColors = [
    { name: '화이트', color: '#ffffff' },
    { name: '크림', color: '#fef7ed' },
    { name: '라벤더', color: '#f3f4f6' },
    { name: '피치', color: '#fef2f2' },
    { name: '민트', color: '#ecfdf5' },
    { name: '선셋', color: '#fff7ed' }
  ];

  const fonts = [
    { name: 'Inter', value: 'Inter' },
    { name: 'Noto Sans', value: 'Noto Sans KR' },
    { name: 'Pretendard', value: 'Pretendard' },
    { name: 'Spoqa Han Sans', value: 'Spoqa Han Sans Neo' }
  ];

  useEffect(() => {
    if (eventId) {
      const foundEvent = storage.getScheduleById(eventId);
      if (foundEvent) {
        setEvent(foundEvent);
        const eventPhotos = storage.getPhotos(eventId);
        setPhotos(eventPhotos);
        
        // Load temporary data from preview page
        const title = sessionStorage.getItem('dumpTitle') || '';
        const memo = sessionStorage.getItem('dumpMemo') || '';
        setDumpTitle(title);
        setDumpMemo(memo);
        
        if (eventPhotos.length === 0 || !title) {
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
      title: dumpTitle,
      memo: dumpMemo,
      style: {
        layout: selectedLayout,
        backgroundColor: selectedBgColor,
        fontFamily: selectedFont
      },
      createdAt: new Date().toISOString()
    };
    
    storage.saveDump(dump);
    
    // Clear temporary session data
    sessionStorage.removeItem('dumpTitle');
    sessionStorage.removeItem('dumpMemo');
    
    navigate(`/result?eventId=${eventId}`);
  };

  const renderPreview = () => {
    const containerStyle = {
      backgroundColor: selectedBgColor,
      fontFamily: selectedFont
    };

    return (
      <div className="bg-white rounded-2xl p-6 shadow-inner border max-h-96 overflow-y-auto" style={containerStyle}>
        <h3 className="text-2xl font-bold text-center mb-2 text-gray-800">
          {dumpTitle}
        </h3>
        
        <div className="text-center text-gray-600 mb-4 text-sm">
          <p>{event?.title}</p>
          <p>{event && new Date(event.date).toLocaleDateString('ko-KR')}</p>
        </div>

        {photos.length > 0 && (
          <div className={`mb-4 ${
            selectedLayout === 'timeline' 
              ? 'space-y-3' 
              : selectedLayout === 'gallery'
                ? 'grid grid-cols-2 gap-2'
                : 'grid grid-cols-1 gap-3'
          }`}>
            {photos.slice(0, 4).map((photo, index) => (
              <div 
                key={index} 
                className={`overflow-hidden ${
                  selectedLayout === 'timeline' 
                    ? 'aspect-video rounded-md' 
                    : selectedLayout === 'gallery'
                      ? 'aspect-square rounded-md'
                      : 'aspect-[4/5] rounded-md bg-white p-2 shadow-md'
                }`}
              >
                <img
                  src={photo}
                  alt={`Photo ${index + 1}`}
                  className={`w-full h-full object-cover ${
                    selectedLayout === 'polaroid' ? 'rounded' : ''
                  }`}
                />
              </div>
            ))}
          </div>
        )}

        {dumpMemo && (
          <p className="text-center text-sm text-gray-600 italic border-t pt-3">
            {dumpMemo}
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
            포토 덤프의 스타일을 선택하고 완성해보세요
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
                <div className="grid grid-cols-3 gap-3">
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

            {/* Font Selection */}
            <Card className="glass-effect border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-bold">폰트 선택</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {fonts.map(font => (
                    <button
                      key={font.value}
                      onClick={() => setSelectedFont(font.value)}
                      className={`w-full p-3 rounded-xl border-2 text-left transition-all duration-200 hover:scale-105 ${
                        selectedFont === font.value 
                          ? 'border-peach bg-peach/20' 
                          : 'border-border hover:border-peach/50'
                      }`}
                      style={{ fontFamily: font.value }}
                    >
                      {font.name}
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
