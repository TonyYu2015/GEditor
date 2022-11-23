import { Layout, Menu, Dropdown } from "antd";
import './App.css';
import GEditor from "./Components/GEditor/Editor_One";

const { Header, Content } = Layout;

const MENU_ITEMS = [
  {
    label: "设置", 
    key: "setting",
    children: [
      {
        label: "页边距",
        key: "padding"
      }
    ]
  }
];

function App() {
  return (
    <Layout
      style={{
        background: "#fff"
      }}
    >
      <Header>
        <Menu
          mode="horizontal"
          items={MENU_ITEMS}
        />
      </Header>
      <Content>
        <GEditor/>
      </Content>
    </Layout>
  );
}

export default App;
