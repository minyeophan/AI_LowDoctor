// src/pages/mypage/MyPage.tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import MypageLayout from '../components/mypage/layout/MypageLayout';
import MyHome from '../components/mypage/myhome/MyHome';
import MyDocuments from '../components/mypage/mydocuments/MyDocument';
import Community from '../components/mypage/mycommunity/MyCommunity';
import Settings from '../components/mypage/settings/Settings';

export default function MyPage() {
  return (
    <MypageLayout>
      <Routes>
        <Route index element={<MyHome />} />
        <Route path="documents" element={<MyDocuments />} />
        <Route path="community" element={<Community />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/mypage" replace />} />
      </Routes>
    </MypageLayout>
  );
}