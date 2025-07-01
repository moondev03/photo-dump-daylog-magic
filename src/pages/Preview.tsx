
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, AlertTriangle } from "lucide-react";
import { storage } from "@/utils/storage";
import { DaylogEvent } from "@/types";
import { toast } from "@/hooks/use-toast";

const Preview = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const eventId = searchParams.get('eventId');
  
  const [event, setEvent] = useState<DaylogEvent | null>(null);
  const [allPhotos, setAllPhotos] = useState<string[]>([]);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [selectedCount, setSelectedCount] = useState<2 | 4 | 6 | 8 | 9>(4);
  const [dumpTitle, setDumpTitle] = useState("");
  const [dumpMemo, setDumpMemo] = useState("");
  const [showTitle, setShowTitle] = useState(true);
  const [showMemo, setShowMemo] = useState(true);

  const availableCounts = [2, 4, 6, 8, 9] as const;

  useEffect(() => {
    if (eventId) {
      const foundEvent = storage.getScheduleById(eventId);
      if (foundEvent) {
        setEvent(foundEvent);
        const eventPhotos = storage.getPhotos(eventId);
        setAllPhotos(eventPhotos);
        
        if (eventPhotos.length === 0) {
          toast({
            title: "사진이 없습니다",
            description: "먼저 사진을 업로드해주세요.",
            variant: "destructive"
          });
          navigate(`/photos?eventId=${eventId}`);
          return;
        }
        
        // Set initial selection
        const initialCount = Math.min(4, eventPhotos.length) as 2 | 4 | 6 | 8 | 9;
        setSelectedCount(initialCount);
        setSelectedPhotos(eventPhotos.slice(0, initialCount));
        setDumpTitle(foundEvent.title);
      } else {
        toast({
          title: "일정을 찾을 수 없습니다",
          description: "캘린더로 돌아갑니다.",
          variant: "destructive"
        });
        navigate('/calendar');
      }
    }
  }, [eventId, navigate]);

  const handleCountChange = (count: string) => {
    const newCount = parseInt(count) as 2 | 4 | 6 | 8 | 9;
    setSelectedCount(newCount);
    
    if (newCount > allPhotos.length) {
      toast({
        title: "사진이 부족합니다",
        description: `${newCount}개의 사진이 필요하지만 ${allPhotos.length}개만 있습니다.`,
        variant: "destructive"
      });
      return;
    }
    
    setSelectedPhotos(allPhotos.slice(0, newCount));
  };

  const handlePhotoSelect = (photoIndex: number) => {
    const photo = allPhotos[photoIndex];
    const currentIndex = selectedPhotos.indexOf(photo);
    
    if (currentIndex >= 0) {
      // Remove photo
      setSelectedPhotos(prev => prev.filter((_, index) => index !== currentIndex));
    } else if (selectedPhotos.length < selectedCount) {
      // Add photo
      setSelectedPhotos(prev => [...prev, photo]);
    } else {
      toast({
        title: "선택 제한",
        description: `최대 ${selectedCount}개의 사진만 선택할 수 있습니다.`,
        variant: "destructive"
      });
    }
  };

  const proceedToStyle = () => {
    try {
      if (selectedPhotos.length !== selectedCount) {
        toast({
          title: "사진 선택 오류",
          description: `정확히 ${selectedCount}개의 사진을 선택해주세요. (현재: ${selectedPhotos.length}개)`,
          variant: "destructive"
        });
        return;
      }

      // Save selected photos
      storage.savePhotos(eventId!, selectedPhotos);
      
      // Save preview data to session storage
      sessionStorage.setItem('dumpTitle', dumpTitle);
      sessionStorage.setItem('dumpMemo', dumpMemo);
      sessionStorage.setItem('showTitle', showTitle.toString());
      sessionStorage.setItem('showMemo', showMemo.toString());
      sessionStorage.setItem('selectedCount', selectedCount.toString());
      
      navigate(`/style?eventId=${eventId}`);
    } catch (error) {
      console.error('Error proceeding to style:', error);
      toast({
        title: "오류 발생",
        description: "스타일 설정 페이지로 이동하는 중 오류가 발생했습니다. 다시 시도해주세요.",
        variant: "destructive"
      });
    }
  };

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-peach/20 to-sunset/20 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-muted-foreground">일정 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-peach/20 to-sunset/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Link to="/" className="inline-block mb-6">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-peach to-sunset bg-clip-text text-transparent">
              마침 - MaChim
            </h1>
          </Link>
          <h2 className="text-3xl font-bold text-foreground mb-4">
            📸 포토 덤프 미리보기
          </h2>
          <p className="text-muted-foreground text-lg">
            {event.title}의 추억을 담은 포토 덤프를 설정해보세요
          </p>
        </div>

        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8">
          {/* Settings */}
          <div className="space-y-6">
            {/* Image Count Selection */}
            <Card className="glass-effect border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="text-xl font-bold">사진 개수 선택</span>
                  <Link to={`/photos?eventId=${eventId}`}>
                    <Button variant="ghost" size="sm">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      사진 관리로 돌아가기
                    </Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Select value={selectedCount.toString()} onValueChange={handleCountChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="사진 개수 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCounts.map(count => (
                        <SelectItem 
                          key={count} 
                          value={count.toString()}
                          disabled={count > allPhotos.length}
                        >
                          {count}개의 사진 {count > allPhotos.length && `(부족함: ${allPhotos.length}개 보유)`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {selectedCount > allPhotos.length && (
                    <div className="flex items-center space-x-2 text-destructive text-sm">
                      <AlertTriangle className="h-4 w-4" />
                      <span>사진이 부족합니다. 더 많은 사진을 업로드하거나 개수를 줄여주세요.</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Photo Selection */}
            <Card className="glass-effect border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-bold">
                  사진 선택 ({selectedPhotos.length}/{selectedCount})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                  {allPhotos.map((photo, index) => {
                    const isSelected = selectedPhotos.includes(photo);
                    const selectionIndex = selectedPhotos.indexOf(photo);
                    
                    return (
                      <div
                        key={index}
                        className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                          isSelected 
                            ? 'border-peach ring-2 ring-peach/30' 
                            : 'border-border hover:border-peach/50'
                        }`}
                        onClick={() => handlePhotoSelect(index)}
                      >
                        <img
                          src={photo}
                          alt={`Photo ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {isSelected && (
                          <div className="absolute top-1 right-1 bg-peach text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                            {selectionIndex + 1}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Content Settings */}
            <Card className="glass-effect border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-bold">내용 설정</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-title">제목 표시</Label>
                    <Switch
                      id="show-title"
                      checked={showTitle}
                      onCheckedChange={setShowTitle}
                    />
                  </div>
                  {showTitle && (
                    <Input
                      placeholder="포토 덤프 제목을 입력하세요"
                      value={dumpTitle}
                      onChange={(e) => setDumpTitle(e.target.value)}
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-memo">메모 표시</Label>
                    <Switch
                      id="show-memo"
                      checked={showMemo}
                      onCheckedChange={setShowMemo}
                    />
                  </div>
                  {showMemo && (
                    <Textarea
                      placeholder="특별한 추억이나 감정을 적어보세요..."
                      value={dumpMemo}
                      onChange={(e) => setDumpMemo(e.target.value)}
                      rows={3}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview */}
          <div className="lg:sticky lg:top-8">
            <Card className="glass-effect border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-bold">미리보기</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-white rounded-2xl p-6 shadow-inner border max-h-96 overflow-y-auto">
                  {showTitle && dumpTitle && (
                    <h3 className="text-xl font-bold text-center mb-4 text-gray-800">
                      {dumpTitle}
                    </h3>
                  )}

                  {selectedPhotos.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {selectedPhotos.slice(0, 4).map((photo, index) => (
                        <div key={index} className="aspect-square rounded-md overflow-hidden">
                          <img
                            src={photo}
                            alt={`Preview ${index + 1}`}
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
              </CardContent>
            </Card>

            {/* Action Button */}
            <div className="mt-6 text-center">
              <Button
                onClick={proceedToStyle}
                size="lg"
                disabled={selectedPhotos.length !== selectedCount}
                className="gradient-peach text-white border-0 px-8 py-4 text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 w-full"
              >
                <ArrowRight className="mr-2 h-5 w-5" />
                🎨 스타일 설정으로 계속
              </Button>
              
              {selectedPhotos.length !== selectedCount && (
                <p className="text-sm text-muted-foreground mt-2">
                  {selectedCount}개의 사진을 선택해주세요 (현재: {selectedPhotos.length}개)
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Preview;
