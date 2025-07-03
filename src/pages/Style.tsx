import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { storage } from "@/utils/storage";
import { MaChimEvent } from "@/types";
import { toast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type LayoutType = 'grid4' | 'grid6' | 'grid8' | 'grid9';

const Style = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const eventId = searchParams.get('eventId');
  const selectedDate = searchParams.get('date');
  
  const [event, setEvent] = useState<MaChimEvent | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [selectedLayout, setSelectedLayout] = useState<LayoutType>('grid4');
  const [selectedBgColor, setSelectedBgColor] = useState<string>('#fefefe');
  const [dumpTitle, setDumpTitle] = useState('');
  const [dumpMemo, setDumpMemo] = useState('');
  const [showTitle, setShowTitle] = useState(true);
  const [showMemo, setShowMemo] = useState(true);
  const [showFrame, setShowFrame] = useState(true);
  const [imageGap, setImageGap] = useState(12);
  const [imageRadius, setImageRadius] = useState(16);

  // Get required photo count based on layout
  const getRequiredPhotoCount = (layout: LayoutType) => {
    switch (layout) {
      case 'grid4': return 4;
      case 'grid6': return 6;
      case 'grid8': return 8;
      case 'grid9': return 9;
      default: return 4;
    }
  };

  // Get available layouts based on total photo count
  const getAvailableLayouts = () => {
    const layouts = [
      {
        id: 'grid4' as LayoutType,
        name: '4장 그리드',
        description: '2x2 격자 형태',
        emoji: '⊞',
        required: 4
      }
    ];

    if (photos.length >= 6) {
      layouts.push({
        id: 'grid6' as LayoutType,
        name: '6장 그리드',
        description: '2x3 격자 형태',
        emoji: '⊟',
        required: 6
      });
    }

    if (photos.length >= 8) {
      layouts.push({
        id: 'grid8' as LayoutType,
        name: '8장 그리드',
        description: '2x4 격자 형태',
        emoji: '⊠',
        required: 8
      });
    }

    if (photos.length >= 9) {
      layouts.push({
        id: 'grid9' as LayoutType,
        name: '9장 그리드',
        description: '3x3 격자 형태',
        emoji: '⊡',
        required: 9
      });
    }

    return layouts;
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        if (!eventId) {
          toast({
            title: "오류 발생",
            description: "일정 정보를 찾을 수 없습니다.",
            variant: "destructive"
          });
          navigate('/calendar');
          return;
        }

        let currentEvent: MaChimEvent | null = null;
        let eventPhotos: string[] = [];

        // 날짜 기반 임시 이벤트인 경우 sessionStorage에서 불러오기
        if (eventId.startsWith('date-')) {
          const tempEvent = sessionStorage.getItem('tempEvent');
          if (!tempEvent) {
            toast({
              title: "오류 발생",
              description: "임시 일정 정보를 찾을 수 없습니다.",
              variant: "destructive"
            });
            navigate('/calendar');
            return;
          }

          currentEvent = JSON.parse(tempEvent) as MaChimEvent;
          eventPhotos = currentEvent.photos || [];
        } else {
          // 일반 일정인 경우 storage에서 불러오기
          currentEvent = storage.getScheduleById(eventId);
          if (!currentEvent) {
            toast({
              title: "일정을 찾을 수 없습니다",
              description: "캘린더로 돌아갑니다.",
              variant: "destructive"
            });
            navigate('/calendar');
            return;
          }
          eventPhotos = storage.getPhotos(eventId) || [];
        }

        if (eventPhotos.length < 4) {
          toast({
            title: "사진이 부족합니다",
            description: "포토 덤프 생성을 위해 최소 4장의 사진이 필요합니다.",
            variant: "destructive"
          });
          navigate(selectedDate ? `/photos?date=${selectedDate}` : `/photos?eventId=${eventId}`);
          return;
        }

        setEvent(currentEvent);
        setPhotos(eventPhotos);
        setSelectedPhotos(eventPhotos.slice(0, 4)); // 초기에 4장 선택
        setDumpTitle(currentEvent.title);
        setDumpMemo(currentEvent.memo || '');
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: "오류 발생",
          description: "데이터를 불러오는 중 오류가 발생했습니다.",
          variant: "destructive"
        });
        navigate('/calendar');
      }
    };

    loadData();
  }, [eventId, navigate, selectedDate]);

  // Handle layout change
  useEffect(() => {
    const requiredCount = getRequiredPhotoCount(selectedLayout);
    if (selectedPhotos.length !== requiredCount) {
      setSelectedPhotos(photos.slice(0, requiredCount));
    }
  }, [selectedLayout, photos]);

  const togglePhotoSelection = (photo: string) => {
    const requiredCount = getRequiredPhotoCount(selectedLayout);
    
    if (selectedPhotos.includes(photo)) {
      // 선택 해제는 항상 가능
      setSelectedPhotos(prev => prev.filter(p => p !== photo));
    } else {
      // 선택은 레이아웃의 최대 개수까지만 가능
      if (selectedPhotos.length < requiredCount) {
        setSelectedPhotos(prev => [...prev, photo]);
      } else {
        toast({
          title: "사진 선택 제한",
          description: `${requiredCount}장의 사진만 선택할 수 있습니다.`,
          variant: "destructive"
        });
      }
    }
  };

  const handleFrameToggle = (show: boolean) => {
    setShowFrame(show);
    if (!show) {
      setShowTitle(false);
      setShowMemo(false);
    }
  };

  const renderPreview = () => {
    if (!event) return null;

    const containerStyle = {
      backgroundColor: showFrame ? selectedBgColor : 'transparent',
      fontFamily: 'Inter',
      padding: showFrame ? '2rem' : '0',
      boxShadow: showFrame ? 'var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' : 'none',
      borderRadius: showFrame ? '1rem' : '0'
    };

    const getLayoutClass = () => {
      switch (selectedLayout) {
        case 'grid4': return 'grid grid-cols-2 gap-3';
        case 'grid6': return 'grid grid-cols-2 gap-3';
        case 'grid8': return 'grid grid-cols-2 gap-3';
        case 'grid9': return 'grid grid-cols-3 gap-3';
        default: return 'grid grid-cols-2 gap-3';
      }
    };

    return (
      <div className="w-full" style={containerStyle}>
        {showFrame && showTitle && dumpTitle && (
          <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
            {dumpTitle}
          </h1>
        )}

        <div className={getLayoutClass()} style={{ gap: `${imageGap}px` }}>
          {selectedPhotos.map((photo, index) => (
            <div 
              key={index} 
              className="aspect-square overflow-hidden"
              style={{ 
                borderRadius: `${imageRadius}px`,
                boxShadow: showFrame ? '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' : 'none'
              }}
            >
              <img
                src={photo}
                alt={`Photo ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>

        {showFrame && showMemo && dumpMemo && (
          <div className="border-t border-gray-200 mt-8 pt-6 text-gray-700">
            <p className="text-center text-lg italic leading-relaxed">
              "{dumpMemo}"
            </p>
          </div>
        )}
      </div>
    );
  };

  const createPhotoDump = () => {
    try {
      if (!eventId || !event) {
        toast({
          title: "오류 발생",
          description: "일정 정보를 찾을 수 없습니다.",
          variant: "destructive"
        });
        return;
      }

      const requiredCount = getRequiredPhotoCount(selectedLayout);
      if (selectedPhotos.length > requiredCount) {
        toast({
          title: "사진 선택 오류",
          description: `${requiredCount}장의 사진만 선택할 수 있습니다.`,
          variant: "destructive"
        });
        return;
      }
      
      const dump = {
        id: Date.now().toString(),
        eventId: event.id,
        title: showTitle ? dumpTitle : '',
        memo: showMemo ? dumpMemo : '',
        showTitle,
        showMemo,
        showFrame,
        style: {
          layout: selectedLayout,
          backgroundColor: selectedBgColor,
          fontFamily: 'Inter',
          imageGap,
          imageRadius
        },
        photos: selectedPhotos,
        createdAt: new Date().toISOString()
      };

      // 임시 이벤트인 경우 sessionStorage에 저장
      if (event.id.startsWith('date-')) {
        sessionStorage.setItem('tempDump', JSON.stringify(dump));
      } else {
        // 일반 이벤트인 경우 storage에 저장
        storage.saveDump(dump);
      }
      
      navigate(`/result?eventId=${event.id}${selectedDate ? `&date=${selectedDate}` : ''}`);

      toast({
        title: "포토 덤프가 생성되었습니다",
        description: "결과 페이지로 이동합니다."
      });
    } catch (error) {
      console.error('Error creating photo dump:', error);
      toast({
        title: "포토 덤프 생성 실패",
        description: "포토 덤프를 생성하는 중 오류가 발생했습니다. 다시 시도해주세요.",
        variant: "destructive"
      });
    }
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
        <div className="text-center mb-12">
          <Link to="/" className="inline-block mb-6">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-peach to-sunset bg-clip-text text-transparent">
              마침 - MaChim
            </h1>
          </Link>
          <h2 className="text-3xl font-bold text-foreground mb-4">
            ✨ 포토 덤프 스타일 설정
          </h2>
          <p className="text-muted-foreground text-lg">
            {event.title}의 포토 덤프를 꾸며보세요
          </p>
          <Link to={selectedDate ? `/photos?date=${selectedDate}` : `/photos?eventId=${event.id}`}>
            <Button variant="ghost" size="sm" className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              사진 선택으로 돌아가기
            </Button>
          </Link>
        </div>

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-8">
          {/* Left Column - Settings */}
          <div className="space-y-6">
            {/* Frame Toggle */}
            <Card className="glass-effect border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl">🖼️ 프레임 설정</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">프레임 표시</p>
                    <p className="text-sm text-muted-foreground">
                      프레임을 끄면 제목과 메모도 함께 숨겨집니다
                    </p>
                  </div>
                  <Switch
                    checked={showFrame}
                    onCheckedChange={handleFrameToggle}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Title & Memo Controls - Only show when frame is on */}
            {showFrame && (
              <Card className="glass-effect border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl">✏️ 텍스트 설정</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">제목 표시</p>
                      <p className="text-sm text-muted-foreground">
                        포토 덤프 상단에 제목을 표시합니다
                      </p>
                    </div>
                    <Switch
                      checked={showTitle}
                      onCheckedChange={setShowTitle}
                    />
                  </div>

                  {showTitle && (
                    <Input
                      placeholder="포토 덤프 제목을 입력하세요"
                      value={dumpTitle}
                      onChange={(e) => setDumpTitle(e.target.value)}
                      className="mt-2"
                    />
                  )}

                  <div className="flex items-center justify-between pt-4">
                    <div>
                      <p className="font-medium">메모 표시</p>
                      <p className="text-sm text-muted-foreground">
                        포토 덤프 하단에 메모를 표시합니다
                      </p>
                    </div>
                    <Switch
                      checked={showMemo}
                      onCheckedChange={setShowMemo}
                    />
                  </div>

                  {showMemo && (
                    <Textarea
                      placeholder="메모를 입력하세요"
                      value={dumpMemo}
                      onChange={(e) => setDumpMemo(e.target.value)}
                      className="mt-2"
                    />
                  )}
                </CardContent>
              </Card>
            )}

            {/* Background Color - Only show when frame is on */}
            {showFrame && (
              <Card className="glass-effect border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl">🎨 배경색 설정</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      variant={selectedBgColor === '#fefefe' ? 'default' : 'outline'}
                      className="h-20 rounded-xl border-2"
                      style={{ backgroundColor: '#fefefe' }}
                      onClick={() => setSelectedBgColor('#fefefe')}
                    >
                      화이트
                    </Button>
                    <Button
                      variant={selectedBgColor === '#f8f8f8' ? 'default' : 'outline'}
                      className="h-20 rounded-xl border-2"
                      style={{ backgroundColor: '#f8f8f8' }}
                      onClick={() => setSelectedBgColor('#f8f8f8')}
                    >
                      라이트 그레이
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Image Style Controls */}
            <Card className="glass-effect border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl">🎨 이미지 스타일</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Image Gap Control */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium">이미지 간격</label>
                    <span className="text-sm text-muted-foreground">{imageGap}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="32"
                    value={imageGap}
                    onChange={(e) => setImageGap(Number(e.target.value))}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    이미지 사이의 간격을 조절합니다
                  </p>
                </div>

                {/* Image Radius Control */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium">모서리 둥글기</label>
                    <span className="text-sm text-muted-foreground">{imageRadius}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="32"
                    value={imageRadius}
                    onChange={(e) => setImageRadius(Number(e.target.value))}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    이미지 모서리의 둥글기를 조절합니다
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Layout Selection */}
            <Card className="glass-effect border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl">🎨 레이아웃 선택</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {getAvailableLayouts().map(layout => (
                    <button
                      key={layout.id}
                      onClick={() => setSelectedLayout(layout.id)}
                      className={`p-4 rounded-xl border-2 transition-all duration-200
                        ${selectedLayout === layout.id 
                          ? 'border-peach bg-peach/10' 
                          : 'border-border hover:border-peach/50'
                        }`}
                    >
                      <div className="text-2xl mb-2">{layout.emoji}</div>
                      <div className="font-medium">{layout.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {layout.description}
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Photo Selection */}
            <Card className="glass-effect border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl">📸 사진 선택</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {getRequiredPhotoCount(selectedLayout)}장의 사진을 선택해주세요
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                  {photos.map((photo, index) => (
                    <button
                      key={index}
                      onClick={() => togglePhotoSelection(photo)}
                      className="relative aspect-square rounded-xl overflow-hidden group"
                    >
                      <img
                        src={photo}
                        alt={`Photo ${index + 1}`}
                        className={`w-full h-full object-cover transition-all duration-200
                          ${selectedPhotos.includes(photo) ? 'brightness-75' : 'group-hover:brightness-75'}`}
                      />
                      {selectedPhotos.includes(photo) && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-peach rounded-full p-1">
                            <Check className="h-4 w-4 text-white" />
                          </div>
                        </div>
                      )}
                      <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                        {selectedPhotos.indexOf(photo) + 1 || '-'}
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Preview */}
          <div className="lg:sticky lg:top-8">
            <Card className="glass-effect border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-bold">실시간 미리보기</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="w-full">
                  {renderPreview()}
                </div>
              </CardContent>
            </Card>

            {/* Action Button */}
            <div className="mt-6 text-center">
              <Button
                onClick={createPhotoDump}
                size="lg"
                className="gradient-peach text-white border-0 px-8 py-4 text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 w-full"
                disabled={selectedPhotos.length === 0}
              >
                <ArrowRight className="mr-2 h-5 w-5" />
                ✨ 포토 덤프 생성하기
              </Button>
              {selectedPhotos.length > 0 && selectedPhotos.length < getRequiredPhotoCount(selectedLayout) && (
                <p className="text-sm text-muted-foreground mt-2">
                  현재 {selectedPhotos.length}장 선택됨 (선택한 레이아웃은 {getRequiredPhotoCount(selectedLayout)}장 필요)
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Style;
