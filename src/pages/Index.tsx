import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { CalendarPlus, Calendar } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-cream/30 to-peach/20">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          {/* Logo/Brand */}
          <div className="mb-8">
            <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-peach to-sunset bg-clip-text text-transparent mb-4">
              MaChim - 마침
            </h1>
            <div className="w-24 h-1 bg-gradient-peach mx-auto rounded-full"></div>
          </div>

          {/* Main Heading */}
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
            하루를 감각적으로
            <br />
            <span className="text-peach">정리해보세요</span>
          </h2>

          {/* Subtext */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 leading-relaxed">
            일정과 사진을 연결해 자동 포토 덤프를 만드는 서비스
            <br />
            <span className="text-lg">당신의 소중한 순간들을 아름답게 기록하세요</span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
            <Link to="/schedule">
              <Button size="lg" className="gradient-peach text-white border-0 px-8 py-6 text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <CalendarPlus className="mr-3 h-6 w-6" />
                ➕ 일정 등록하기
              </Button>
            </Link>
            
            <Link to="/calendar">
              <Button variant="outline" size="lg" className="px-8 py-6 text-lg font-semibold rounded-2xl border-2 border-peach text-peach hover:bg-peach hover:text-white transition-all duration-300 hover:scale-105">
                <Calendar className="mr-3 h-6 w-6" />
                📅 일정 확인하기
              </Button>
            </Link>
          </div>
        </div>

        {/* Service Preview */}
        <div className="max-w-6xl mx-auto">
          <div className="glass-effect rounded-3xl p-8 md:p-12 shadow-2xl">
            <h3 className="text-2xl md:text-3xl font-bold text-center mb-8 text-foreground">
              이런 포토 덤프를 만들 수 있어요
            </h3>
            
            <div className="grid md:grid-cols-3 gap-8">
              {/* Timeline Style */}
              <div className="text-center">
                <div className="w-full h-48 bg-gradient-to-br from-lavender/50 to-accent/30 rounded-2xl mb-4 flex items-center justify-center">
                  <div className="text-4xl">📝</div>
                </div>
                <h4 className="font-semibold text-lg mb-2">타임라인형</h4>
                <p className="text-muted-foreground text-sm">시간 순서대로 정리된 하루</p>
              </div>

              {/* Gallery Style */}
              <div className="text-center">
                <div className="w-full h-48 bg-gradient-to-br from-mint/50 to-cream/50 rounded-2xl mb-4 flex items-center justify-center">
                  <div className="text-4xl">🖼️</div>
                </div>
                <h4 className="font-semibold text-lg mb-2">갤러리형</h4>
                <p className="text-muted-foreground text-sm">사진 중심의 깔끔한 정리</p>
              </div>

              {/* Polaroid Style */}
              <div className="text-center">
                <div className="w-full h-48 bg-gradient-to-br from-peach/30 to-sunset/30 rounded-2xl mb-4 flex items-center justify-center">
                  <div className="text-4xl">📸</div>
                </div>
                <h4 className="font-semibold text-lg mb-2">폴라로이드형</h4>
                <p className="text-muted-foreground text-sm">감성적인 빈티지 스타일</p>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-20 grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center p-6">
            <div className="text-4xl mb-4">⏰</div>
            <h4 className="font-semibold text-lg mb-2">간편한 일정 등록</h4>
            <p className="text-muted-foreground text-sm">몇 번의 클릭으로 하루 일정을 빠르게 입력</p>
          </div>
          
          <div className="text-center p-6">
            <div className="text-4xl mb-4">📷</div>
            <h4 className="font-semibold text-lg mb-2">사진 자동 연결</h4>
            <p className="text-muted-foreground text-sm">일정에 맞는 사진을 드래그 앤 드롭으로 추가</p>
          </div>
          
          <div className="text-center p-6">
            <div className="text-4xl mb-4">🎨</div>
            <h4 className="font-semibold text-lg mb-2">다양한 스타일</h4>
            <p className="text-muted-foreground text-sm">취향에 맞는 레이아웃과 색상으로 커스터마이징</p>
          </div>
          
          <div className="text-center p-6">
            <div className="text-4xl mb-4">💾</div>
            <h4 className="font-semibold text-lg mb-2">즉시 저장</h4>
            <p className="text-muted-foreground text-sm">완성된 포토 덤프를 PNG로 저장하거나 공유</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
