import { Button } from 'UnityEngine.UI';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script';
import { ZepetoWorldContent, WorldMultiplayChatContent, QuickMessage } from 'ZEPETO.World';

export default class QuickChat extends ZepetoScriptBehaviour {

    public quickChatBtn: Button;

    Start() {
        // 현재 월드의 퀵채팅 리스트 가져오기
        ZepetoWorldContent.GetQuickMessageList(quickMessageList => {
            // quickMessageList.forEach((quickMessage: QuickMessage, index: number, array: QuickMessage[]) => {
            //     console.log(`id = ${quickMessage.id}, message = ${quickMessage.message}`);
            // });
        }, err => {
            console.log(`QuickMessage Error: ${err}`);
        });

        // "Hi" 메시지 보내기
        this.quickChatBtn.onClick.AddListener(() => {
            this.OnClickQuickMessageButton("zw_quickchat_preset_001");
        });
    }

    // 멀티플레이 서버로 quickId에 해당하는 메시지 전송
    private OnClickQuickMessageButton(quickId: string) {
        WorldMultiplayChatContent.instance.SendQuickMessage(quickId);
    }

}