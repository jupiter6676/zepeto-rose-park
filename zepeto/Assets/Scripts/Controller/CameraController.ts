import { ZepetoScriptBehaviour } from 'ZEPETO.Script';
import { Input, Time, Vector3 } from 'UnityEngine';

export default class CameraController extends ZepetoScriptBehaviour {

    public move_speed: number = 0;
    public rotate_speed: number = 0;

    private x_rotate: number;
    private y_rotate: number;
    
    Update() {    
        // 키보드로 카메라 이동
        const key_x: number = Input.GetAxis("Horizontal") * this.move_speed * Time.deltaTime;
        const key_y: number = Input.GetAxis("Jump") * this.move_speed * Time.deltaTime;
        const key_z: number = Input.GetAxis("Vertical") * this.move_speed * Time.deltaTime;

        this.transform.Translate(new Vector3(key_x, key_y, key_z));

        // 마우스로 카메라 회전
        const mouse_x: number = -Input.GetAxis("Mouse Y") * this.rotate_speed * Time.deltaTime; // 좌우
        const mouse_y: number = Input.GetAxis("Mouse X") * this.rotate_speed * Time.deltaTime;  // 위아래

        if (Input.GetMouseButton(0)) {
            this.y_rotate = this.transform.eulerAngles.y + mouse_y;
            this.x_rotate = this.transform.eulerAngles.x + mouse_x;
    
            this.transform.eulerAngles = new Vector3(this.x_rotate, this.y_rotate, 0);
        }
    }

}