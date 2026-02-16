import { useState } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import { TranscribeStreamingClient, StartStreamTranscriptionCommand } from "@aws-sdk/client-transcribe-streaming";
import MicrophoneStream from "microphone-stream";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-providers";

const IDENTITY_POOL_ID = import.meta.env.VITE_COGNITO_IDENTITY_POOL_ID;
const REGION = import.meta.env.VITE_AWS_REGION || "ap-northeast-1";

export function useTranscribe(onTextUpdate) {
  const [isRecording, setIsRecording] = useState(false);
  const [controller, setController] = useState(null);

  async function startRecording() {
    if (!IDENTITY_POOL_ID) {
      alert("環境変数 VITE_COGNITO_IDENTITY_POOL_ID が設定されていません。");
      return;
    }

    setIsRecording(true);
    const abortController = new AbortController();
    setController(abortController);

    let micStream = null;

    try {
      const session = await fetchAuthSession();
      const idToken = session.tokens?.idToken?.toString();
      if (!idToken) throw new Error("認証トークンが取得できません");

      // 1. マイク準備
      micStream = new MicrophoneStream();
      micStream.setStream(await window.navigator.mediaDevices.getUserMedia({ video: false, audio: true }));

      // 2. 正しいサンプリングレートを取得
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const sampleRate = audioContext.sampleRate;
      audioContext.close();

      const client = new TranscribeStreamingClient({
        region: REGION,
        credentials: fromCognitoIdentityPool({
          clientConfig: { region: REGION },
          identityPoolId: IDENTITY_POOL_ID,
          logins: {
            [`cognito-idp.${REGION}.amazonaws.com/${session.tokens.idToken.payload.iss.split('/').pop()}`]: idToken
          }
        })
      });

      // 3. 音声ストリーム作成（ここで形式変換を行う）
      const audioStream = async function* () {
        for await (const chunk of micStream) {
          if (abortController.signal.aborted) break;

          // ★重要: ブラウザの音声(Float32)をAWS用(Int16)に変換する
          // chunk は Buffer だが、中身は Float32Array なので変換が必要
          const float32Arr = new Float32Array(chunk.buffer, chunk.byteOffset, chunk.byteLength / 4);
          const int16Arr = new Int16Array(float32Arr.length);

          for (let i = 0; i < float32Arr.length; i++) {
            const s = Math.max(-1, Math.min(1, float32Arr[i]));
            int16Arr[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
          }

          yield { AudioEvent: { AudioChunk: new Uint8Array(int16Arr.buffer) } };
        }
      };

      // 4. 送信
      const command = new StartStreamTranscriptionCommand({
        LanguageCode: "ja-JP",
        MediaEncoding: "pcm",
        MediaSampleRateHertz: sampleRate, // 自動取得したレートを使う
        AudioStream: audioStream()
      });

      const response = await client.send(command, { abortSignal: abortController.signal });

      // 5. 受信処理
      for await (const event of response.TranscriptResultStream) {
        if (abortController.signal.aborted) break;

        if (event.TranscriptEvent) {
          const results = event.TranscriptEvent.Transcript.Results;
          if (results.length > 0 && !results[0].IsPartial) {
            const transcript = results[0].Alternatives[0].Transcript;
            onTextUpdate((prev) => prev + transcript);
          }
        }
      }
    } catch (e) {
      // 中断以外のエラーのみアラート
      if (e.name !== 'AbortError' && !abortController.signal.aborted) {
        console.error(e);
        alert("音声入力エラー: " + (e instanceof Error ? e.message : String(e)));
      }
    } finally {
      if (micStream) micStream.stop();
      setIsRecording(false);
      setController(null);
    }
  }

  function stopRecording() {
    if (controller) {
      controller.abort();
    }
  }

  return { isRecording, startRecording, stopRecording };
}
