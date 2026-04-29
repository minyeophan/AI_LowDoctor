// src/components/mypage/layout/MypageLayout.tsx
import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import '../../mypage/layout/MypageLayout.css';

interface MypageLayoutProps {
  children: ReactNode;
}

export default function MypageLayout({ children }: MypageLayoutProps) {
  return (
    <div className="mypage-container">
      <Sidebar />
      <main className="mypage-content">
        {children}
      </main>
    </div>
  );
}