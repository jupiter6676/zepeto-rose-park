import { AnimationClip, Animator, Color, Gizmos, HumanBodyBones, Physics, Transform, Vector3, WaitForEndOfFrame } from 'UnityEngine'
import { ZepetoCharacter, ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'

import InteractionIcon from './InteractionIcon'

export default class InteractionGesture extends ZepetoScriptBehaviour {

    @SerializeField() private animationClip: AnimationClip;     // 앉는 제스처 애니메이션
    @SerializeField() private isSnapBone: boolean = true;       // bodyBone의 위치를 Dock Point에 딱 붙게 할 것인지
    @SerializeField() private bodyBone: HumanBodyBones;         // Dock Point에 닿게할 신체 부분 (Hips)
    @SerializeField() private allowOverlap: boolean = false;    // 한 자리에 여러 명이 겹쳐 앉을 수 있는지

    private _interactionIcon: InteractionIcon;
    private _isFirst: boolean = true;
    private _localCharacter: ZepetoCharacter;   // Player
    private _outPos: Vector3;   // 플레이어가 일어나는 위치 (= Dock Point의 위치)
    private _playerGesturePos: Vector3; // 플레이어가 제스처를 취하는 위치 (플레이어 ~ Dock Point 위치의 사이)
    
    Start() {    
        this._interactionIcon = this.transform.GetComponent<InteractionIcon>();
        
        // 로컬 플레이어가 정상적으로 생성되면, 그 플레이어를 this._localCharacter로 설정
        ZepetoPlayers.instance.OnAddedLocalPlayer.AddListener(() => {
            this._localCharacter = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character;
        });
        
        // 상호작용 아이콘을 클릭하면, 아이콘 비활성화 & DoInteraction() 함수 호출
        this._interactionIcon.OnClickEvent.AddListener(() => {
            this._interactionIcon.HideIcon();
            this.DoInteraction();
        })
    }
    
    private DoInteraction() {
        this._outPos = this.transform.position;

        // 의자에 엉덩이를 딱 붙이고, 방향도 제대로 보게 하고 싶을 때
        if (this.isSnapBone) {
            // 여러 명이 겹쳐 앉을 수 있거나, 자리가 비어있으면
            if (this.allowOverlap || this.FindOtherPlayerNum() < 1) {
                this._localCharacter.SetGesture(this.animationClip);    // 앉는 제스처 실행
                this.StartCoroutine(this.SnapBone());
                this.StartCoroutine(this.WaitForExit());
            } else {
                // 자리가 다 찼으면
                this._interactionIcon.ShowIcon();   // 상호작용 아이콘만 활성화
            }
        } else {
            // 의자에 아무렇게나 앉아있어도 될 때
            this._localCharacter.SetGesture(this.animationClip);
            this.StartCoroutine(this.WaitForExit());
        }
    }

    OnDrawGizmos() {
        const animator: Animator = this._localCharacter.ZepetoAnimator;
        const bone: Transform = animator.GetBoneTransform(this.bodyBone);

        Gizmos.color = Color.red;
        Gizmos.DrawLine(bone.position, this._localCharacter.transform.position);

        const distance = Vector3.op_Subtraction(bone.position, this._localCharacter.transform.position);
        Gizmos.color = Color.blue;
        Gizmos.DrawLine(this.transform.position, distance);
    }

    // Dock Point에 bodyBone 붙이기
    private *SnapBone() {
        const animator: Animator = this._localCharacter.ZepetoAnimator;
        const bone: Transform = animator.GetBoneTransform(this.bodyBone);   // 엉덩이의 위치 정보

        const wait: WaitForEndOfFrame = new WaitForEndOfFrame();    // 캐싱 (반복문마다 new를 사용하면 메모리 낭비)
        let idx = 0;

        while (true) {
            const distance = Vector3.op_Subtraction(bone.position, this._localCharacter.transform.position);    // 엉덩이의 위치와 캐릭터의 위치의 차이
            const newPos: Vector3 = Vector3.op_Subtraction(this.transform.position, distance);  // Dock Point의 위치와 distance의 차이

            // console.log(this.transform.position);
            // console.log(newPos);
            // console.log(this._localCharacter.transform.position)

            this._playerGesturePos = newPos;    // 제스처를 취할 위치를 새로 갱신
            this._localCharacter.transform.position = this._playerGesturePos;   // 캐릭터의 위치를 새로 갱신
            this._localCharacter.transform.rotation = this.transform.rotation;

            yield wait;  // 모든 카메라, GUI의 렌더링 작업이 끝날 때까지 대기
            idx++;

            // 애니메이션의 5프레임동안 위치를 보정 (?)
            if (idx > 5) {
                return;
            }
        }
    }

    // 최적화를 위해 로컬 클라이언트로 계산되었으나, 정확하게 하려면 서버 코드를 살펴봐야 함.
    private FindOtherPlayerNum() {
        // Dock Point 위치에 존재하는 오브젝트들
        const hitInfos = Physics.OverlapSphere(this.transform.position, 0.1);

        let playerNum = 0;  // 앉아있는 제페토 캐릭터들
        if (hitInfos.length > 0) {
            hitInfos.forEach((hitInfo) => {
                // 그 오브젝트가 제페토 캐릭터이면, 수를 1 증가
                if (hitInfo.transform.GetComponent<ZepetoCharacter>()) {
                    playerNum++;
                }
            })
        }

        return playerNum;
    }

    private *WaitForExit() {
        if (this._localCharacter) {
            while (true) {
                // 캐릭터가 점프하거나 움직이면
                if (this._localCharacter.tryJump || this._localCharacter.tryMove) {
                    this._localCharacter.CancelGesture();   // 제스처를 취소
                    this.transform.position = this._outPos; // Dock Point에서 일어나게 된다.
                    this._interactionIcon.ShowIcon();       // 아이콘 활성화
                    break;
                } else if (this.isSnapBone && this._playerGesturePos != this._localCharacter.transform.position) {
                    this._interactionIcon.ShowIcon();
                    break;
                }

                yield;
            }
        }
    }

}