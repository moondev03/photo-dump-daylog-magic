
import { useState, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Download, Share2, Calendar } from "lucide-react";
import { storage } from "@/utils/storage";
import { DaylogEvent, PhotoDump } from "@/types";

const Result = () => {
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('eventId');
  const dumpRef = useRef<HTMLDivElement>(null);
  
  const [event, setEvent] = useState<DaylogEvent | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [dump, setDump] = useState<PhotoDump | null>(null);

  useEffect(() => {
    if (eventId) {
      const foundEvent = storage.getScheduleById(eventId);
      const foundDump = storage.getDump(eventId);
      
      if (foundEvent && foundDump) {
        setEvent(foundEvent);
        setDump(foundDump);
        const eventPhotos = storage.getPhotos(eventId);
        setPhotos(eventPhotos);
      } else {
        window.location.href = '/calendar';
      }
    }
  }, [eventId]);

  const downloadAsPNG = async () => {
    if (!dumpRef.current) return;

    try {
      toast({
        title: "다운로드 기능 준비 중",
        description: "실제 서비스에서는 PNG 파일로 다운로드됩니다.",
      });
    } catch (error) {
      toast({
        title: "다운로드 실패",
        description: "다시 시도해주세요.",
        variant: "destructive"
      });
    }
  };

  const shareLink = () => {
    const currentUrl = window.location.href;
    navigator.clipboard.writeText(currentUrl).then(() => {
      toast({
        title: "링크가 복사되었습니다! 📎",
        description: "포토 덤프 링크를 친구들과 공유해보세요."
      });
    }).catch(() => {
      toast({
        title: "복사 실패",
        description: "다시 시도해주세요.",
        variant: "destructive"
      });
    });
  };

  const renderPhotos = () => {
    if (!dump) return null;

    const layoutClass = {
      'grid': 'grid grid-cols-2 md:grid-cols-3 gap-3',
      'masonry': 'columns-2 md:columns-3 gap-3 space-y-3',
      'collage': 'grid grid-cols-2 md:grid-cols-4 gap-2',
      'minimal': 'space-y-6'
    }[dump.style.layout] || 'grid grid-cols-2 md:grid-cols-3 gap-3';

    return (
      <div className={layoutClass}>
        {photos.map((photo, index) => {
          const isFirstInCollage = dump.style.layout === 'collage' && index === 0;
          const aspectClass = {
            'grid': 'aspect-square',
            'masonry': index % 3 === 0 ? 'aspect-[3/4]' : index % 3 === 1 ? 'aspect-square' : 'aspect-[4/3]',
            'collage': isFirstInCollage ? 'col-span-2 aspect-[2/1]' : 'aspect-square',
            'minimal': 'aspect-[4/3]'
          }[dump.style.layout] || 'aspect-square';

          return (
            <div 
              key={index} 
              className={`${aspectClass} rounded-2xl overflow-hidden shadow-lg ${
                dump.style.layout === 'masonry' ? 'break-inside-avoid' : ''
              }`}
            >
              <img
                src={photo}
                alt={`Memory ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          );
        })}
      </div>
    );
  };

  const renderPhotoDump = () => {
    if (!event || !dump || photos.length === 0) return null;

    const containerStyle = {
      backgroundColor: dump.style.backgroundColor,
      fontFamily: dump.style.fontFamily,
      minHeight: '600px'
    };

    return (
      <div className="w-full rounded-2xl p-8 shadow-lg" style={containerStyle} ref={dumpRef}>
        {/* Title - only show if enabled and exists */}
        {dump.showTitle && dump.title && (
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-8 text-gray-800">
            {dump.title}
          </h1>
        )}

        {/* Photos */}
        <div className="mb-8">
          {renderPhotos()}
        </div>

        {/* Memo - only show if enabled and exists */}
        {dump.showMemo && dump.memo && (
          <div className="border-t border-gray-200 pt-6 text-gray-700">
            <p className="text-center text-lg italic leading-relaxed">
              "{dump.memo}"
            </p>
          </div>
        )}

        {/* Minimal footer */}
        <div className="text-center text-gray-400 mt-8 text-xs">
          <p>{new Date(dump.createdAt).toLocaleDateString('ko-KR')}</p>
        </div>
      </div>
    );
  };

  if (!event || !dump) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-peach/20 to-sunset/20 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-muted-foreground">포토 덤프를 불러오는 중...</p>
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
            ✅ 포토 덤프 완성!
          </h2>
          <p className="text-muted-foreground text-lg">
            당신의 소중한 순간이 아름다운 포토 덤프로 완성되었습니다
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Photo Dump Display */}
          <Card className="glass-effect border-0 shadow-2xl overflow-hidden">
            <CardContent className="p-0">
              {renderPhotoDump()}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={downloadAsPNG}
              size="lg"
              className="gradient-peach text-white border-0 px-8 py-4 text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <Download className="mr-2 h-5 w-5" />
              📥 PNG 다운로드
            </Button>
            
            <Button
              onClick={shareLink}
              variant="outline"
              size="lg"
              className="px-8 py-4 text-lg font-semibold rounded-2xl border-2 border-peach text-peach hover:bg-peach hover:text-white transition-all duration-300 hover:scale-105"
            >
              <Share2 className="mr-2 h-5 w-5" />
              📤 공유 링크 복사
            </Button>
          </div>

          {/* Navigation */}
          <div className="text-center">
            <Link to="/calendar">
              <Button
                variant="ghost"
                size="lg"
                className="text-lg text-muted-foreground hover:text-peach"
              >
                <Calendar className="mr-2 h-5 w-5" />
                📅 캘린더로 돌아가기
              </Button>
            </Link>
          </div>

          {/* Success Message */}
          <Card className="glass-effect border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-center text-2xl font-bold text-peach">
                🎉 완성!
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-lg text-muted-foreground">
                포토 덤프가 성공적으로 생성되었습니다.
              </p>
              <p className="text-sm text-muted-foreground">
                더 많은 일정을 등록하고 다양한 포토 덤프를 만들어보세요! ✨
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Result;
