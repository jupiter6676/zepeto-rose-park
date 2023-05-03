import { Sandbox, SandboxOptions, SandboxPlayer } from "ZEPETO.Multiplay";
import { DataStorage } from "ZEPETO.Multiplay.DataStorage";
import { Player } from "ZEPETO.Multiplay.Schema";

export default class extends Sandbox {

    onCreate(options: SandboxOptions) {
        // 클라이언트로부터 수신된 메시지 확인
        this.onMessage("onChangedState", (client, message) => {
            const player = this.state.players.get(cliend.sessionId);    // 메시지를 보낸 플레이어 정보 불러오기
            player.state = message.state;
        });
    }

    // client가 Room에 입장 시 호출
    async onJoin(client: SandboxPlayer) {
        // 입장한 client의 정보
        console.log(`[OnJoin] sessionId: ${client.sessionId}, HashCode: ${client.hashCode}, userId: ${client.userId}`);

        const player = new Player();    // 스키마에서 정의한 Player 타입
        player.sessionId = client.sessionId;

        if (client.HashCode) {
            player.zepetoHash = client.hashCode;
        }

        if (client.userId) {
            player.zepetoUserId = client.userId;
        }

        // 플레이어 데이터를 서버에 저장
        const storage: DataStorage = client.loadDataStorage();

        // client의 방문 횟수 저장
        let visit_cnt = await storage.get("VisitCount") as number;
        if (visit_cnt == null) visit_cnt = 0;

        console.log(`[OnJoin] ${client.sessionId}'s visiting count: ${visit_cnt}`);

        await storage.set("VisitCount", ++visit_cnt);   // Player의 VisitCount를 갱신해서, Data Storage에 저장
        
        this.state.players.set(client.sessionId, player);   // 지금까지 설정한 Player의 정보를 Room State에 정의한 players에 저장
    }

    onLeave(client: SandboxPlayer, consented?: boolean) {
        
    }
}