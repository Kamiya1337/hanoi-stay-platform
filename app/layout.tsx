import type { Metadata } from "next";
import "./globals.css";
// Import Lính gác bảo mật chúng ta vừa tạo
import AuthWrapper from "@/components/layout/AuthWrapper";

export const metadata: Metadata = {
  title: "Hanoi Stay - Quản lý trọ",
  description: "Phần mềm quản lý nhà trọ, căn hộ dịch vụ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>
        {/* Trao toàn quyền bảo vệ và hiển thị giao diện cho AuthWrapper */}
        <AuthWrapper>
          {children}
        </AuthWrapper>
      </body>
    </html>
  );
}