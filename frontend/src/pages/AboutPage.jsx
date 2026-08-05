import {
    CheckCircleOutlined,
    ClockCircleOutlined,
    CompassOutlined,
    CreditCardOutlined,
    DownOutlined,
    EnvironmentOutlined,
    FileProtectOutlined,
    FileTextOutlined,
    HeartOutlined,
    HomeOutlined,
    InfoCircleOutlined,
    MailOutlined,
    PhoneOutlined,
    RocketOutlined,
    SafetyCertificateOutlined,
    SmileOutlined,
    StarOutlined,
    TeamOutlined,
    ThunderboltOutlined,
    ToolOutlined,
    UserOutlined,
} from "@ant-design/icons";
import { Avatar, Button, Card, Divider, Dropdown, Layout, Space, Tag, Typography } from "antd";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const { Content, Header, Footer } = Layout;
const { Title, Text, Paragraph } = Typography;

const AboutPage = () => {
    const navigate = useNavigate();
    const { logout, user } = useAuth();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const userMenuItems = useMemo(
        () => [
            {
                key: "user-header",
                disabled: true,
                label: (
                    <div className="user-menu-header">
                        <div className="user-menu-info-name">{user?.name || "Người dùng"}</div>
                        <div className="user-menu-info-email">{user?.email || "Tenant Portal"}</div>
                    </div>
                ),
            },
            {
                key: "/user",
                icon: <HomeOutlined style={{ color: "#0f766e" }} />,
                label: "Trang tổng quan",
            },
            {
                key: "/user/my-rooms",
                icon: <HomeOutlined style={{ color: "#0f766e" }} />,
                label: "Phòng của tôi",
            },
            {
                key: "/user/contracts",
                icon: <FileProtectOutlined style={{ color: "#2563eb" }} />,
                label: "Hợp đồng",
            },
            {
                key: "/user/invoices",
                icon: <FileTextOutlined style={{ color: "#d97706" }} />,
                label: "Hóa đơn",
            },
            {
                key: "/user/repair-requests",
                icon: <ToolOutlined style={{ color: "#e11d48" }} />,
                label: "Báo sự cố",
            },
            {
                key: "/user/profile",
                icon: <UserOutlined style={{ color: "#4f46e5" }} />,
                label: "Hồ sơ cá nhân",
            },
            {
                type: "divider",
            },
            {
                key: "logout",
                icon: <UserOutlined style={{ color: "#e11d48" }} />,
                label: <span style={{ color: "#e11d48", fontWeight: 600 }}>Đăng xuất</span>,
            },
        ],
        [user]
    );

    const handleUserMenuClick = ({ key }) => {
        if (key === "logout") {
            handleLogout();
        } else if (key && key !== "user-header") {
            navigate(key);
        }
    };

    return (
        <Layout className="app-shell">
            {/* ====== HEADER ====== */}
            <Header className="app-header">
                <div className="brand" onClick={() => navigate("/")}>
                    <HomeOutlined style={{ fontSize: 24, color: "#0d9488" }} />
                    <span>TRO PLUS</span>
                    <span className="brand-badge">Premium</span>
                </div>

                <Space size="large">
                    <Button type="text" onClick={() => navigate("/")} style={{ color: "#ffffff", fontWeight: 600 }}>
                        Trang chủ
                    </Button>
                    <Button type="text" onClick={() => navigate("/about")} style={{ color: "#6ee7b7", fontWeight: 700 }}>
                        Giới thiệu
                    </Button>

                    {user ? (
                        <Dropdown
                            menu={{ items: userMenuItems, onClick: handleUserMenuClick }}
                            overlayClassName="user-dropdown-popover"
                            trigger={["click"]}
                            placement="bottomRight"
                        >
                            <div className="header-user-btn">
                                <Avatar className="header-user-avatar" size={34} icon={<UserOutlined />}>
                                    {user?.name?.[0]?.toUpperCase()}
                                </Avatar>
                                <div className="header-user-info-text">
                                    <span className="header-user-name">{user?.name || "Tài khoản"}</span>
                                    <span className="header-user-role">Người thuê trọ</span>
                                </div>
                                <DownOutlined style={{ fontSize: 11, opacity: 0.8 }} />
                            </div>
                        </Dropdown>
                    ) : (
                        <>
                            <Button onClick={() => navigate("/login")} style={{ borderRadius: 8 }}>
                                Đăng nhập
                            </Button>
                            <Button
                                type="primary"
                                onClick={() => navigate("/register")}
                                style={{ background: "#0f766e", borderColor: "#0f766e", borderRadius: 8, fontWeight: 600 }}
                            >
                                Đăng ký
                            </Button>
                        </>
                    )}
                </Space>
            </Header>

            <Content className="app-content" style={{ maxWidth: "100%", padding: 0 }}>
                {/* ====== HERO BANNER ====== */}
                <div className="about-hero-wrapper">
                    <div className="about-hero-content">
                        <Tag color="success" style={{ padding: "4px 14px", borderRadius: 20, fontWeight: 700, fontSize: 13, marginBottom: 16 }}>
                            ✨ Nền Tảng Quản Lý Trọ Hiện Đại #1
                        </Tag>
                        <Title level={1} className="about-hero-title">
                            Giải Pháp Thuê & Quản Lý Phòng Trọ Minh Bạch, Tiện Lợi
                        </Title>
                        <Paragraph className="about-hero-subtitle">
                            <strong>TRO PLUS</strong> ra đời với sứ mệnh chuyển đổi số mô hình quản lý phòng trọ truyền thống, mang đến cho người thuê giải pháp tìm phòng nhanh chóng, minh bạch chi phí điện nước và tương tác trực tiếp 24/7 với chủ nhà.
                        </Paragraph>
                        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", marginTop: 24 }}>
                            <Button
                                type="primary"
                                size="large"
                                icon={<RocketOutlined />}
                                onClick={() => navigate("/")}
                                style={{ background: "#0d9488", borderColor: "#0d9488", height: 48, borderRadius: 10, fontWeight: 700, paddingLeft: 28, paddingRight: 28 }}
                            >
                                Khám phá phòng trống
                            </Button>
                            {user ? (
                                <Button
                                    size="large"
                                    icon={<UserOutlined />}
                                    onClick={() => navigate("/user")}
                                    style={{ height: 48, borderRadius: 10, fontWeight: 600, background: "rgba(255,255,255,0.12)", color: "#ffffff", borderColor: "rgba(255,255,255,0.25)" }}
                                >
                                    Vào Portal người dùng
                                </Button>
                            ) : (
                                <Button
                                    size="large"
                                    icon={<UserOutlined />}
                                    onClick={() => navigate("/register")}
                                    style={{ height: 48, borderRadius: 10, fontWeight: 600, background: "rgba(255,255,255,0.12)", color: "#ffffff", borderColor: "rgba(255,255,255,0.25)" }}
                                >
                                    Đăng ký tài khoản
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* ====== STATS COUNTER BAR ====== */}
                <div style={{ maxWidth: 1200, margin: "-40px auto 60px auto", padding: "0 24px", position: "relative", zIndex: 10 }}>
                    <div className="about-stats-grid">
                        <div className="about-stat-card">
                            <div className="about-stat-icon teal"><HomeOutlined /></div>
                            <div>
                                <div className="about-stat-value">200+</div>
                                <div className="about-stat-label">Phòng trọ cao cấp</div>
                            </div>
                        </div>
                        <div className="about-stat-card">
                            <div className="about-stat-icon blue"><TeamOutlined /></div>
                            <div>
                                <div className="about-stat-value">500+</div>
                                <div className="about-stat-label">Khách thuê tin dùng</div>
                            </div>
                        </div>
                        <div className="about-stat-card">
                            <div className="about-stat-icon amber"><SmileOutlined /></div>
                            <div>
                                <div className="about-stat-value">99%</div>
                                <div className="about-stat-label">Đánh giá hài lòng</div>
                            </div>
                        </div>
                        <div className="about-stat-card">
                            <div className="about-stat-icon rose"><ClockCircleOutlined /></div>
                            <div>
                                <div className="about-stat-value">24/7</div>
                                <div className="about-stat-label">Hỗ trợ kỹ thuật</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ====== CORE VALUES SECTION ====== */}
                <div style={{ maxWidth: 1200, margin: "0 auto 70px auto", padding: "0 24px" }}>
                    <div style={{ textAlign: "center", marginBottom: 40 }}>
                        <Text strong style={{ color: "#0f766e", textTransform: "uppercase", letterSpacing: 1, fontSize: 13 }}>GÍA TRỊ CỐT LÕI</Text>
                        <Title level={2} style={{ marginTop: 6, marginBottom: 12, color: "#0f172a" }}>Why Choose TRO PLUS?</Title>
                        <Paragraph type="secondary" style={{ fontSize: 16, maxWidth: 640, margin: "0 auto" }}>
                            Chúng tôi cam kết mang lại trải nghiệm sống văn minh, an toàn và hiện đại nhất cho mọi cư dân.
                        </Paragraph>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24 }}>
                        <Card className="about-value-card">
                            <div className="about-value-icon" style={{ background: "#ccfbf1", color: "#0f766e" }}>
                                <SafetyCertificateOutlined />
                            </div>
                            <Title level={4} style={{ marginBottom: 8, marginTop: 16 }}>Minh Bạch 100%</Title>
                            <Paragraph type="secondary" style={{ margin: 0, lineHeight: 1.6 }}>
                                Giá thuê phòng, đơn giá điện nước và phí dịch vụ được niêm yết công khai rõ ràng, không chi phí ẩn.
                            </Paragraph>
                        </Card>

                        <Card className="about-value-card">
                            <div className="about-value-icon" style={{ background: "#dbeafe", color: "#1d4ed8" }}>
                                <ThunderboltOutlined />
                            </div>
                            <Title level={4} style={{ marginBottom: 8, marginTop: 16 }}>Đặt Cọc QR Tức Thì</Title>
                            <Paragraph type="secondary" style={{ margin: 0, lineHeight: 1.6 }}>
                                Tích hợp mã VietQR động giúp khách hàng đặt giữ chỗ phòng online nhanh chóng, chính xác tuyệt đối.
                            </Paragraph>
                        </Card>

                        <Card className="about-value-card">
                            <div className="about-value-icon" style={{ background: "#fef3c7", color: "#b45309" }}>
                                <ToolOutlined />
                            </div>
                            <Title level={4} style={{ marginBottom: 8, marginTop: 16 }}>Xử Lý Sự Cố Nhanh</Title>
                            <Paragraph type="secondary" style={{ margin: 0, lineHeight: 1.6 }}>
                                Gửi báo cáo sự cố hư hỏng kèm hình ảnh trực tiếp từ Portal, đội ngũ kỹ thuật phản hồi chỉ trong 2h.
                            </Paragraph>
                        </Card>

                        <Card className="about-value-card">
                            <div className="about-value-icon" style={{ background: "#ffe4e6", color: "#be123c" }}>
                                <FileProtectOutlined />
                            </div>
                            <Title level={4} style={{ marginBottom: 8, marginTop: 16 }}>Hợp Đồng Điện Tử</Title>
                            <Paragraph type="secondary" style={{ margin: 0, lineHeight: 1.6 }}>
                                Lưu trữ hợp đồng thuê nhà điện tử chuẩn pháp lý, dễ dàng truy cứu và tái ký bất cứ lúc nào.
                            </Paragraph>
                        </Card>
                    </div>
                </div>

                {/* ====== HOW IT WORKS STEP TIMELINE ====== */}
                <div style={{ background: "#f8fafc", padding: "64px 24px", borderTop: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0", marginBottom: 70 }}>
                    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
                        <div style={{ textAlign: "center", marginBottom: 48 }}>
                            <Text strong style={{ color: "#0f766e", textTransform: "uppercase", letterSpacing: 1, fontSize: 13 }}>QUY TRÌNH ĐƠN GIẢN</Text>
                            <Title level={2} style={{ marginTop: 6, marginBottom: 12 }}>4 Bước Để Thuê Phòng Nhanh Chóng</Title>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
                            <div className="about-step-card">
                                <div className="about-step-number">01</div>
                                <Title level={4} style={{ margin: "12px 0 8px 0" }}>Tìm Kiếm Phòng</Title>
                                <Paragraph type="secondary" style={{ fontSize: 13, margin: 0 }}>
                                    Duyệt danh sách phòng khả dụng theo khoảng giá, diện tích và khu vực ưa thích.
                                </Paragraph>
                            </div>

                            <div className="about-step-card">
                                <div className="about-step-number">02</div>
                                <Title level={4} style={{ margin: "12px 0 8px 0" }}>Xem Chi Tiết & Hẹn</Title>
                                <Paragraph type="secondary" style={{ fontSize: 13, margin: 0 }}>
                                    Xem đầy đủ hình ảnh thực tế, tiện ích phòng và liên hệ chủ nhà hẹn lịch xem trực tiếp.
                                </Paragraph>
                            </div>

                            <div className="about-step-card">
                                <div className="about-step-number">03</div>
                                <Title level={4} style={{ margin: "12px 0 8px 0" }}>Đặt Cọc Giữ Chỗ</Title>
                                <Paragraph type="secondary" style={{ fontSize: 13, margin: 0 }}>
                                    Quét mã QR VietQR chuyển khoản cọc giữ phòng trực tiếp trên hệ thống an toàn.
                                </Paragraph>
                            </div>

                            <div className="about-step-card">
                                <div className="about-step-number">04</div>
                                <Title level={4} style={{ margin: "12px 0 8px 0" }}>Ký HĐ & Nhận Phòng</Title>
                                <Paragraph type="secondary" style={{ fontSize: 13, margin: 0 }}>
                                    Ký hợp đồng thuê nhà điện tử, nhận chìa khóa và bắt đầu trải nghiệm sống tuyệt vời.
                                </Paragraph>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ====== CONTACT & SUPPORT CTA ====== */}
                <div style={{ maxWidth: 1200, margin: "0 auto 80px auto", padding: "0 24px" }}>
                    <div className="about-contact-banner">
                        <div style={{ flex: 1 }}>
                            <Title level={3} style={{ color: "#ffffff", margin: "0 0 8px 0" }}>
                                Bạn Cần Tư Vấn Tìm Phòng Trọ Phù Hợp?
                            </Title>
                            <Paragraph style={{ color: "#cbd5e1", margin: 0, fontSize: 15 }}>
                                Đội ngũ tư vấn của TRO PLUS luôn sẵn sàng hỗ trợ giải đáp mọi thắc mắc 24/7.
                            </Paragraph>
                        </div>
                        <Space size="middle" wrap style={{ marginTop: 16 }}>
                            <Button
                                size="large"
                                icon={<PhoneOutlined />}
                                style={{ height: 46, borderRadius: 8, fontWeight: 700, background: "#ffffff", color: "#0f766e", borderColor: "#ffffff" }}
                            >
                                Hotline: 0988 123 456
                            </Button>
                            <Button
                                size="large"
                                icon={<MailOutlined />}
                                onClick={() => window.open("mailto:support@troplus.com")}
                                style={{ height: 46, borderRadius: 8, fontWeight: 600, background: "rgba(255,255,255,0.15)", color: "#ffffff", borderColor: "rgba(255,255,255,0.3)" }}
                            >
                                Gửi Email hỗ trợ
                            </Button>
                        </Space>
                    </div>
                </div>
            </Content>

            {/* ====== FOOTER ====== */}
            <Footer className="app-footer">
                <div className="footer-grid">
                    <div className="footer-col">
                        <div className="brand" style={{ marginBottom: 12 }} onClick={() => navigate("/")}>
                            <HomeOutlined style={{ fontSize: 22, color: "#0d9488" }} />
                            <span>TRO PLUS</span>
                        </div>
                        <p>Hệ thống quản lý và cho thuê phòng trọ hiện đại, minh bạch và an toàn hàng đầu.</p>
                    </div>
                    <div className="footer-col">
                        <h4>Liên kết nhanh</h4>
                        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                            <li><a href="/" style={{ color: "inherit", textDecoration: "none" }}>Trang chủ phòng trống</a></li>
                            <li><a href="/about" style={{ color: "#38bdf8", textDecoration: "none" }}>Giới thiệu website</a></li>
                            <li><a href="/user" style={{ color: "inherit", textDecoration: "none" }}>Portal người dùng</a></li>
                        </ul>
                    </div>
                    <div className="footer-col">
                        <h4>Dịch vụ cư dân</h4>
                        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                            <li>Báo cáo sự cố hư hỏng</li>
                            <li>Tra cứu hóa đơn điện nước</li>
                            <li>Xem hợp đồng thuê phòng</li>
                        </ul>
                    </div>
                    <div className="footer-col">
                        <h4>Liên hệ hỗ trợ</h4>
                        <p><EnvironmentOutlined /> Tòa nhà TRO PLUS, Hà Nội</p>
                        <p><PhoneOutlined /> Hotline: 0988 123 456</p>
                        <p><MailOutlined /> Email: support@troplus.com</p>
                    </div>
                </div>
                <div className="footer-bottom">
                    © {new Date().getFullYear()} TRO PLUS - Hệ Thống Quản Lý Phòng Trọ Smart Living.
                </div>
            </Footer>
        </Layout>
    );
};

export default AboutPage;