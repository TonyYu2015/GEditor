import { Layout } from "antd";
import './App.css';
import GEditor from "./Components/GEditor";

const { Header, Content } = Layout;

function App() {
  return (
    <Layout>
      <Header>
        223344
      </Header>
      <Content>
        <GEditor/>
      </Content>
    </Layout>
  );
}

export default App;
