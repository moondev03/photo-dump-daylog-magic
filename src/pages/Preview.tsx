
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { storage } from "@/utils/storage";
import { DaylogEvent } from "@/types";
import { toast } from "@/hooks/use-toast";

const Preview = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const eventId = searchParams.get('eventId');
  
  const [event, setEvent] = useState<DaylogEvent | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [dumpTitle, setDumpTitle] = useState("");
  const [dumpMemo, setDumpMemo] = useState("");
  const [showTitle, setShowTitle] = useState(false);
  const [showMemo, setShowMemo] = useState(false);

  useEffect(() => {
    if (eventId) {
      const foundEvent = storage.getScheduleById(eventId);
      if (foundEvent) {
        setEvent(foundEvent);
        const eventPhotos = storage.getPhotos(eventId);
        setPhotos(eventPhotos);
        
        if (eventPhotos.length === 0) {
          toast({
            title: "사진이 없습니다",
            description: "먼저 사진을 업로드해주세요.",
            variant: "destructive"
          });
          navigate(`/photos?eventId=${eventId}`);
        }
      } else {
        navigate('/calendar');
      }
    }
  }, [eventId, navigate]);

  const proceedToStyle = () => {
    if (photos.length === 0) {
      toast({
        title: "사진을 업로드해주세요",
        description: "최소 1장의 사진이 필요합니다.",
        variant: "destructive"
      });
      return;
    }

    // Save temporary data for style page
    sessionStorage.setItem('dumpTitle', showTitle ? dumpTitle : '');
    sessionStorage.setItem('dumpMemo', showMemo ? dumpMemo : '');
    sessionStorage.setItem('showTitle', showTitle.toString());
    sessionStorage.setItem('showMemo', showMemo.toString());

    navigate(`/style?eventId=${eventId}`);
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
              Daylog
            </h1>
          </Link>
          <h2 className="text-3xl font-bold text-foreground mb-4">
            ✨ 포토 덤프 미리보기
          </h2>
          <p className="text-muted-foreground text-lg">
            포토 덤프의 내용을 확인하고 제목과 메모를 설정해보세요
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Event Info */}
          <Card className="glass-effect border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="text-2xl font-bold">{event.title}</span>
                <Link to={`/photos?eventId=${eventId}`}>
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    사진 업로드로 돌아가기
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-muted-foreground">
                <p>📅 {new Date(event.date).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long'
                })}</p>
                {(event.startTime || event.endTime) && (
                  <p>⏰ {event.startTime} {event.startTime && event.endTime && '- '} {event.endTime}</p>
                )}
                {event.memo && (
                  <p>📝 {event.memo}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Photo Preview */}
          <Card className="glass-effect border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">업로드된 사진들 ({photos.length}장)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photos.map((photo, index) => (
                  <div key={index} className="aspect-square rounded-xl overflow-hidden bg-muted shadow-md">
                    <img
                      src={photo}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Optional Content Settings */}
          <Card className="glass-effect border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">포토 덤프 설정</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Title Option */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-title"
                    checked={showTitle}
                    onCheckedChange={setShowTitle}
                  />
                  <Label htmlFor="show-title" className="text-base font-medium">
                    제목 추가하기
                  </Label>
                </div>
                
                {showTitle && (
                  <div className="space-y-2">
                    <Label htmlFor="dump-title">포토 덤프 제목</Label>
                    <Input
                      id="dump-title"
                      value={dumpTitle}
                      onChange={(e) => setDumpTitle(e.target.value)}
                      placeholder="예: 🌇 오늘의 하루, ☕ 카페 투어..."
                      className="text-lg"
                    />
                  </div>
                )}
              </div>

              {/* Memo Option */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-memo"
                    checked={showMemo}
                    onCheckedChange={setShowMemo}
                  />
                  <Label htmlFor="show-memo" className="text-base font-medium">
                    메모 추가하기
                  </Label>
                </div>
                
                {showMemo && (
                  <div className="space-y-2">
                    <Label htmlFor="dump-memo">포토 덤프 메모</Label>
                    <Textarea
                      id="dump-memo"
                      value={dumpMemo}
                      onChange={(e) => setDumpMemo(e.target.value)}
                      placeholder="이 순간에 대한 감상이나 메모를 남겨보세요..."
                      rows={4}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Preview Section */}
          <Card className="glass-effect border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">미리보기</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-white rounded-2xl p-6 shadow-inner border">
                {showTitle && dumpTitle && (
                  <h3 className="text-2xl font-bold text-center mb-6 text-gray-800">
                    {dumpTitle}
                  </h3>
                )}
                
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {photos.slice(0, 4).map((photo, index) => (
                    <div key={index} className="aspect-square rounded-lg overflow-hidden">
                      <img
                        src={photo}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>

                {showMemo && dumpMemo && (
                  <p className="text-center text-gray-600 italic border-t pt-4">
                    "{dumpMemo}"
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action Button */}
          <div className="flex justify-center">
            <Button
              onClick={proceedToStyle}
              size="lg"
              disabled={photos.length === 0}
              className="gradient-peach text-white border-0 px-8 py-4 text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <ArrowRight className="mr-2 h-5 w-5" />
              다음 → 스타일 설정
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Preview;
