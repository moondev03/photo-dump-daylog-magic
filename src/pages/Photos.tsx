
import { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, X, ArrowRight } from "lucide-react";
import { storage } from "@/utils/storage";
import { DaylogEvent, UploadedPhoto } from "@/types";

const Photos = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const eventId = searchParams.get('eventId');
  
  const [event, setEvent] = useState<DaylogEvent | null>(null);
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (eventId) {
      const foundEvent = storage.getScheduleById(eventId);
      if (foundEvent) {
        setEvent(foundEvent);
        loadExistingPhotos(eventId);
      } else {
        toast({
          title: "일정을 찾을 수 없습니다",
          description: "올바른 일정을 선택해주세요.",
          variant: "destructive"
        });
        navigate('/calendar');
      }
    }
  }, [eventId, navigate]);

  const loadExistingPhotos = (eventId: string) => {
    const existingPhotoUrls = storage.getPhotos(eventId);
    if (existingPhotoUrls.length > 0) {
      const existingPhotos = existingPhotoUrls.map((url, index) => ({
        id: `existing-${index}`,
        file: new File([], `photo-${index}.jpg`), // Placeholder file
        preview: url
      }));
      setPhotos(existingPhotos);
    }
  };

  const handleFileSelect = (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter(file => file.type.startsWith('image/'));
    
    if (fileArray.length === 0) {
      toast({
        title: "이미지 파일을 선택해주세요",
        description: "JPG, PNG 형식의 이미지만 업로드 가능합니다.",
        variant: "destructive"
      });
      return;
    }

    let processedCount = 0;
    const newPhotos: UploadedPhoto[] = [];

    fileArray.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const photo: UploadedPhoto = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          file,
          preview: e.target?.result as string
        };
        newPhotos.push(photo);
        processedCount++;
        
        if (processedCount === fileArray.length) {
          setPhotos(prev => [...prev, ...newPhotos].slice(0, 10)); // Max 10 photos
          
          if (newPhotos.length > 0) {
            toast({
              title: "사진이 업로드되었습니다",
              description: `${newPhotos.length}장의 사진이 추가되었습니다.`
            });
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileSelect(e.target.files);
    }
  };

  const removePhoto = (id: string) => {
    setPhotos(prev => prev.filter(photo => photo.id !== id));
  };

  const proceedToPreview = () => {
    if (photos.length === 0) {
      toast({
        title: "사진을 업로드해주세요",
        description: "최소 1장의 사진이 필요합니다.",
        variant: "destructive"
      });
      return;
    }

    // Save photo URLs to storage
    const photoUrls = photos.map(photo => photo.preview);
    storage.savePhotos(eventId!, photoUrls);

    toast({
      title: "사진이 저장되었습니다",
      description: "미리보기 페이지로 이동합니다."
    });

    navigate(`/preview?eventId=${eventId}`);
  };

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-mint/20 to-peach/20 flex items-center justify-center">
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
            📸 사진 업로드
          </h2>
          <p className="text-muted-foreground text-lg">
            {event?.title}의 추억을 담은 사진들을 업로드해보세요
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Event Info */}
          <Card className="glass-effect border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="text-2xl font-bold">{event.title}</span>
                <Link to="/calendar">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    캘린더로 돌아가기
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

          {/* Photo Upload Area */}
          <Card className="glass-effect border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">사진 업로드 ({photos.length}/10)</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Upload Zone */}
              <div
                className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
                  dragOver 
                    ? 'border-peach bg-peach/10 scale-105' 
                    : 'border-muted-foreground/30 hover:border-peach hover:bg-peach/5'
                }`}
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
              >
                <Upload className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  사진을 드래그하거나 클릭해서 업로드하세요
                </h3>
                <p className="text-muted-foreground mb-6">
                  최대 10장까지 업로드 가능합니다 (JPG, PNG)
                </p>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileInput}
                  className="hidden"
                  id="photo-upload"
                />
                <label htmlFor="photo-upload">
                  <Button 
                    type="button"
                    variant="outline" 
                    className="border-2 border-peach text-peach hover:bg-peach hover:text-white cursor-pointer"
                    asChild
                  >
                    <span>📸 사진 선택하기</span>
                  </Button>
                </label>
              </div>

              {/* Photo Grid */}
              {photos.length > 0 && (
                <div className="mt-8">
                  <h4 className="text-lg font-semibold mb-4">업로드된 사진들</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {photos.map((photo, index) => (
                      <div key={photo.id} className="relative group">
                        <div className="aspect-square rounded-xl overflow-hidden bg-muted">
                          <img
                            src={photo.preview}
                            alt={`Upload ${index + 1}`}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 rounded-full w-8 h-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removePhoto(photo.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                          {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-4">
                    💡 사진들은 번호 순서대로 포토 덤프에 배치됩니다
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-center">
            <Button
              onClick={proceedToPreview}
              size="lg"
              disabled={photos.length === 0}
              className="gradient-peach text-white border-0 px-8 py-4 text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <ArrowRight className="mr-2 h-5 w-5" />
              다음 → 미리보기
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Photos;
