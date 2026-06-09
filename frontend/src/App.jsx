import { Layout } from "antd";
import HomePage from "./pages/HomePage";

const { Content, Header } = Layout;

const App = () => (
  <Layout className="app-shell">
    <Header className="app-header">
      <div className="brand">Project Base</div>
    </Header>
    <Content className="app-content">
      <HomePage />
    </Content>
  </Layout>
);

export default App;
