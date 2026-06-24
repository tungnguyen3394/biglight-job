/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // produce a self-contained server bundle for the Docker image
  output: "standalone",
  // Trang chủ "/" phục vụ thẳng file thiết kế gốc (bản sao 100%).
  // Các trang mockup khác (detail, mypage, salary, app) cũng truy cập được
  // theo tên file của chúng trong /public.
  async rewrites() {
    return {
      beforeFiles: [{ source: "/", destination: "/biglight-job-worker.html" }],
    };
  },
};

export default nextConfig;
