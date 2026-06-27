// Nút Messenger nổi ở góc dưới đã ngừng dùng (hay đè lên các nút khác trên mobile).
// Đã thay bằng nút Messenger nổi bật trên header — xem components/common/MessengerLink.tsx.
// Giữ component này (render null) để các trang đang import không phải sửa hàng loạt.
export default function MessengerPopupButton() {
  return null;
}
