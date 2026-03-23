export const metadata = {
  title: '개인정보처리방침 | Studio HaeTae',
  description: '스튜디오 해태 개인정보처리방침',
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-black text-[#E7E5DF] py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-display mb-10">개인정보처리방침</h1>

        <div className="space-y-8 text-sm leading-relaxed opacity-80">
          <section>
            <h2 className="text-lg font-semibold mb-3 opacity-100">1. 개인정보의 처리 목적</h2>
            <p>
              스튜디오 해태(이하 &quot;회사&quot;)는 다음의 목적을 위하여 개인정보를 처리합니다.
              처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며,
              이용 목적이 변경되는 경우에는 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>프로젝트 상담 및 견적 문의 처리</li>
              <li>서비스 제공 및 계약 이행</li>
              <li>고객 문의 응대 및 불만 처리</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3 opacity-100">2. 수집하는 개인정보 항목</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>필수항목: 이름, 이메일, 연락처</li>
              <li>선택항목: 회사명, 프로젝트 내용</li>
              <li>자동수집항목: 접속 IP, 브라우저 정보, 방문 일시</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3 opacity-100">3. 개인정보의 보유 및 이용 기간</h2>
            <p>
              회사는 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다.
              단, 관계 법령에 의하여 보존할 필요가 있는 경우 해당 법령에서 정한 기간 동안 보존합니다.
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>계약 또는 청약철회 등에 관한 기록: 5년</li>
              <li>소비자의 불만 또는 분쟁처리에 관한 기록: 3년</li>
              <li>웹사이트 방문 기록: 3개월</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3 opacity-100">4. 개인정보의 제3자 제공</h2>
            <p>
              회사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다.
              다만, 이용자의 동의가 있거나 법령의 규정에 의한 경우에는 예외로 합니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3 opacity-100">5. 개인정보의 파기 절차 및 방법</h2>
            <p>
              회사는 개인정보 보유 기간의 경과, 처리 목적 달성 등 개인정보가 불필요하게 되었을 때에는
              지체 없이 해당 개인정보를 파기합니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3 opacity-100">6. 정보주체의 권리·의무</h2>
            <p>이용자는 개인정보 주체로서 다음과 같은 권리를 행사할 수 있습니다.</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>개인정보 열람 요구</li>
              <li>오류 등이 있을 경우 정정 요구</li>
              <li>삭제 요구</li>
              <li>처리 정지 요구</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3 opacity-100">7. 개인정보 보호책임자</h2>
            <ul className="list-none space-y-1">
              <li>담당자: 스튜디오 해태</li>
              <li>이메일: studiohaetae@gmail.com</li>
              <li>전화: 010-7727-4374</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3 opacity-100">8. 개인정보처리방침 변경</h2>
            <p>
              이 개인정보처리방침은 2026년 3월 23일부터 적용됩니다.
              변경 사항이 있을 경우 웹사이트를 통하여 공지할 예정입니다.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
