import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
// ★追加1: Amplifyライブラリの読み込み
import { Amplify } from 'aws-amplify';

// ★追加2: Cognitoの設定
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: 'ap-northeast-1_QGnxtDo7k', // ここを書き換える
      userPoolClientId: '62br5f1r1ou7hkl9r88os42mg5',    // ここを書き換える
    }
  }
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
