import { CharacterState, SpawnInfo, ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { Room, RoomData } from 'ZEPETO.Multiplay';
import { Player, State, Vector3 } from 'ZEPETO.Multiplay.Schema';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script';
import { ZepetoWorldMultiplay } from 'ZEPETO.World';
import * as UnityEngine from 'UnityEngine';

export default class ClientStarter extends ZepetoScriptBehaviour {
    
    public multiplay: ZepetoWorldMultiplay;
    private room: Room;

    // 클라이언트 고유 값인 sessionId로 player 객체 저장 → key: sessionId, value: player
    private currentPlayers: Map<string, Player> = new Map<string, Player>();

    Start() {
        // Room Event Listener 등록
        this.multiplay.RoomCreated += (room: Room) => {
            this.room = room;
        };

        this.multiplay.RoomJoined += (room: Room) => {
            room.OnStateChange += this.OnStateChange;   // State가 변할 때마다 호출되는 함수
        };

        // 서버에 내 위치 전송
        this.StartCoroutine(this.SendMessageLoop(0.1));
    }

    private *SendMessageLoop(tick: number) {
        while (true) {
            yield new UnityEngine.WaitForSeconds(tick);

            // 룸이 없거나, 룸에 연결되지 않은 경우에 대한 예외 처리
            if (this.room != null && this.room.IsConnected) {
                const hasPlayer = ZepetoPlayers.instance.HasPlayer(this.room.SessionId);    // 로컬 플레이어의 인스턴스 존재 여부

                // 인스턴스가 있으면, myPlayer 객체에 해당 인스턴스 저장
                if (hasPlayer) {
                    const myPlayer = ZepetoPlayers.instance.GetPlayer(this.room.SessionId);

                    // 캐릭터가 움직이고 있는 경우
                    if (myPlayer.character.CurrentState != CharacterState.Idle) {
                        this.SendTransform(myPlayer.character.transform);
                    }
                }
            }
        }
    }
    
    // 플레이어의 Join, Update, Leave에 관련된 처리
    private OnStateChange(state: State, isFirst: boolean) {
        // ZepetoPlayers에 이벤트 리스너 등록
        if (isFirst) {
            // Local Player 인스턴스가 Scene에 완전히 로드되었을 때 호출된다.
            ZepetoPlayers.instance.OnAddedLocalPlayer.AddListener(() => {
                const myPlayer = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer;
                
                // character: 플레이에서 동적으로 생성된, 실제 Character Controller가 포함된 오브젝트
                myPlayer.character.OnChangedState.AddListener((cur, prev) => {
                    this.SendState(cur);    // 이 이벤트가 발생할 때마다 캐릭터 State(cur, prev)를 서버로 전송
                });
            });

            // 다른 캐릭터 위치를 전송받는다.
            ZepetoPlayers.instance.OnAddedPlayer.AddListener((sessionId: string) => {
                const isLocal = this.room.SessionId === sessionId;

                // 로컬 플레이어가 아닌 경우에만 업데이트
                if (!isLocal) {
                    const player: Player = this.currentPlayers.get(sessionId);

                    // OnChange 이벤트에, 플레이어 위치를 업데이트하는 OnUpdatePlayer 함수를 연결;
                    player.OnChange += (ChangeValues) => this.OnUpdatePlayer(sessionId, player);
                }
            })
        }
        
        let join = new Map<string, Player>();
        let leave = new Map<string, Player>(this.currentPlayers);   // currentPlayers로 초기화
        
        // 스키마의 Room State에 저장된 플레이어 정보를 하나씩 조회
        state.players.ForEach((sessionId: string, player: Player) => {
            // currentPlayers가 저장된 클라이언트의 sessionId를 가지고 있지 않으면
            // 방금 입장한 플레이어이니까, set으로 join에 등록
            if (!this.currentPlayers.has(sessionId)) {
                join.set(sessionId, player);
            }

            leave.delete(sessionId);    // 현재 room에 존재하는 플레이어는 모두 제거
        });
        
        // Room에 새 플레이어가 입장할 때 이벤트를 받을 수 있게, player 객체에 이벤트 연결
        join.forEach((player: Player, sessionId: string) => this.OnJoinPlayer(sessionId, player));

        // Room에서 플레이어가 퇴장할 때 이벤트를 받을 수 있게, player 객체에 이벤트 연결
        leave.forEach((player: Player, sessionId: string) => this.OnLeavePlayer(sessionId, player));
    }
    
    // Room 입장 시 플레이어 이벤트 처리
    private OnJoinPlayer(sessionId: string, player: Player) {
        console.log(`[OnJoinPlayer] players - sessionId: ${sessionId}`);

        // 입장한 플레이어를 관리하기 위해, 지금 입장한 플레이어를 currentPlayers에 등록
        // 입장한 모든 플레이어는 currentPlayers에 등록되어, 지금 입장한 플레이어는 currentPlayers에 sessionId가 없는 경우로 판단
        this.currentPlayers.set(sessionId, player);

        // 플레이어 인스턴스의 초기 Transform 설정
        const spawnInfo = new SpawnInfo();
        const position = new UnityEngine.Vector3(0, 0, 0);
        const rotation = new UnityEngine.Vector3(0, 0, 0);

        spawnInfo.position = position;
        spawnInfo.rotation = UnityEngine.Quaternion.Euler(rotation);

        // Room과 Player의 sessionId가 같으면 Local Player이다.
        const isLocal = this.room.SessionId === player.sessionId;

        // 플레이어 인스턴스 생성
        ZepetoPlayers.instance.CreatePlayerWithUserId(sessionId, player.zepetoUserId, spawnInfo, isLocal);
    }

    // Room 퇴장 시 플레이어 이벤트 처리
    private OnLeavePlayer(sessionId: string, player: Player) {
        console.log(`[OnLeavePlayer] players - sessionId: ${sessionId}`);
        
        this.currentPlayers.delete(sessionId);  // currentPlayers 목록에서 플레이어 제거
        ZepetoPlayers.instance.RemovePlayer(sessionId); // 플레이어 인스턴스 제거
    }

    // 플레이어의 위치를 업데이트
    private OnUpdatePlayer(sessionId: string, player: Player) {
        const position = this.ParseVector3(player.transform.position);
        
        const zepetoPlayer = ZepetoPlayers.instance.GetPlayer(sessionId);
        zepetoPlayer.character.MoveToPosition(position);

        // CharacterState가 Jump인 경우, 실제 캐릭터도 점프하도록
        if (player.state === CharacterState.JumpIdle || player.state === CharacterState.JumpMove) {
            zepetoPlayer.character.Jump();
        }
    }

    private SendState(state: CharacterState) {
        const data = new RoomData();

        data.Add("state", state);   // CharacterState는 ZEPETO.Character.Controller에 정의된 enum 타입 (Invalid, Idle, Walk, Run 등)
        this.room.Send("onChangedState", data.GetObject()); // 클라에서 서버로 메시지 송신
    }

    private SendTransform(transform: UnityEngine.Transform) {
        const data = new RoomData();

        const pos = new RoomData();
        pos.Add("x", transform.localPosition.x);
        pos.Add("y", transform.localPosition.y);
        pos.Add("z", transform.localPosition.z);
        data.Add("position", pos.GetObject());

        const rot = new RoomData();
        rot.Add("x", transform.localEulerAngles.x);
        rot.Add("y", transform.localEulerAngles.y);
        rot.Add("z", transform.localEulerAngles.z);
        data.Add("rotation", rot.GetObject());

        // onChangedTransform 타입으로, data를 메시지로 전송한다.
        this.room.Send("onChangedTransform", data.GetObject());
    }

    private ParseVector3(vector3: Vector3): UnityEngine.Vector3 {
        return new UnityEngine.Vector3(vector3.x, vector3.y, vector3.z);
    }

}