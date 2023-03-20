import { Layout } from "antd";
import './App.css';
import GEditor from "./Components/GEditor/Editor_One/index";
// import GEditorSharedb from "./Components/GEditor/Editor_One/index_sharedb";
// import PEditor from "./Components/PEditor/pEditor";

const { Content } = Layout;

function App() {
  return (
    <Layout
      style={{
        background: "#fff"
      }}
    >
      {/* <Header>
        <Menu
          mode="horizontal"
          items={MENU_ITEMS}
        />
      </Header> */}
      <Content>
        <GEditor/>
        {/* <PEditor/> */}
      </Content>
    </Layout>
  );
}

export default App;
