import { Layout } from "antd";
import './App.css';
import GEditor from "./Editor_One/index";
// import GEditorSharedb from "./Editor_One/index_sharedb";

const { Content } = Layout;

function App() {
  return (
    <Layout
      style={{
        background: "#fff"
      }}
    >
      <Content>
        <GEditor/>
      </Content>
    </Layout>
  );
}

export default App;
