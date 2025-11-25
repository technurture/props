"use client";
import AutoBreadcrumb from "@/core/common-components/breadcrumb/AutoBreadcrumb"
import CommonFooter from "@/core/common-components/common-footer/commonFooter"

const StarterPageComponent = () => {
  return (
    <>
      {/* ========================
			Start Page Content
		========================= */}
      <div className="page-wrapper">
        {/* Start Content */}
        <div className="content">
          {/* Page Header */}
          <AutoBreadcrumb title="Starter Page"/>
          {/* End Page Header */}
        </div>
        {/* End Content */}
        {/* Start Footer */}
        <CommonFooter/>
        {/* End Footer */}
      </div>
      {/* ========================
			End Page Content
		========================= */}
    </>
  )
}

export default StarterPageComponent