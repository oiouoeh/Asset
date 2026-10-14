# Family Asset Manager – GitHub Pages 배포 가이드

## 파일 구성
| 파일 | 역할 |
|---|---|
| index.html | 프로그램 본체 (FamilyAssetManager_v1_13.html과 동일) |
| manifest.webmanifest | 홈 화면 앱 설치 정보 (이름, 아이콘, 색상) |
| sw.js | 서비스 워커 – 오프라인 실행 캐시 |
| icon-192.png / icon-512.png / icon-maskable-512.png | 앱 아이콘 |
| .nojekyll | GitHub Pages의 Jekyll 처리 비활성화 |

## 배포 순서
1. GitHub에서 새 저장소 생성 (예: `family-asset`). 무료 계정은 **Public** 저장소여야 Pages 사용 가능.
2. **Add file → Upload files** 로 이 폴더의 파일 전체를 저장소 루트에 업로드 → Commit.
   - `.nojekyll`은 숨김 파일이라 탐색기에서 안 보일 수 있음. 없어도 동작에는 문제 없음.
3. **Settings → Pages → Build and deployment**
   - Source: `Deploy from a branch`, Branch: `main` / `(root)` → Save.
4. 1~2분 후 주소 생성: `https://<GitHub아이디>.github.io/family-asset/`

## 갤럭시 폰/태블릿에 설치
1. Chrome(또는 삼성 인터넷)으로 위 주소 접속.
2. 메뉴(⋮) → **홈 화면에 추가 / 앱 설치**.
3. 이후 홈 화면 아이콘으로 실행 – 전체 화면, 오프라인에서도 실행됨.

## 데이터 관련 주의사항
- 입력 데이터는 **GitHub에 올라가지 않고**, 각 기기 브라우저(localStorage)에만 저장됨. 저장소가 Public이어도 자산 데이터는 공개되지 않음.
- 기기별로 데이터가 따로 저장됨 (폰 ↔ 태블릿 자동 동기화 없음). 프로그램의 **백업/복원** 기능으로 옮길 것.
- 브라우저 "사이트 데이터 삭제" 또는 앱 삭제 시 데이터가 지워지므로 정기적으로 백업 파일을 보관할 것.
- 저장소 이름(주소)을 바꾸면 다른 사이트로 인식되어 기존 데이터가 보이지 않음 → 바꾸기 전에 백업.

## 버전 업데이트 방법
1. 새 버전 HTML(예: v1.14)을 `index.html` 이름으로 덮어써서 업로드.
2. `sw.js` 첫 줄의 `const CACHE = 'fam-v1.13.1';` 를 `'fam-v1.14'` 로 변경 후 업로드.
3. 폰에서 앱을 한 번 열었다 닫았다 다시 열면 새 버전 적용 (온라인 상태 필요).

## GitHub 저장소를 삭제/비공개로 바꿀 경우
- `sw.js`(fam-v1.13.1 이후)는 서버가 404를 돌려줘도 휴대폰에 캐시된 앱을 대신 실행함.
- 단, **삭제 전에** 각 기기에서 수정된 sw.js가 적용된 상태여야 함 (온라인에서 앱을 2회 이상 열기).
- 삭제 후에는 업데이트 불가, 브라우저가 캐시를 정리하면 앱이 사라질 수 있음 → 백업 파일 필수 보관.
- 가장 안정적인 방법은 저장소를 유지하는 것 (자산 데이터는 저장소에 올라가지 않음).
