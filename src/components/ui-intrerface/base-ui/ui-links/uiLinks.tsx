"use client";

import AutoBreadcrumb from "@/core/common-components/breadcrumb/AutoBreadcrumb";
import CommonFooter from "@/core/common-components/common-footer/commonFooter";
import Link from "next/link";

const UiLinksComponent = () => {
  return (
    <>
    {/* ========================
              Start Page Content
          ========================= */}
    <div className="page-wrapper">
      {/* Start Content */}
      <div className="content pb-0">
        {/* Page Header */}
        <AutoBreadcrumb title="Links" />
        {/* End Page Header */}
        {/* start row */}
        <div className="row">
          <div className="col-xl-6">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title">Colored links</h5>
              </div>
              <div className="card-body">
                <p className="text-muted">
                  You can use the <code>.link-*</code> classes to colorize links.
                  Unlike the{" "}
                  <Link href="#" aria-label="Text utility classes documentation">
                    <code>.text-*</code> classes
                  </Link>
                  , these classes have a <code>:hover</code> and{" "}
                  <code>:focus</code> state. Some of the link styles use a
                  relatively light foreground color, and should only be used on a
                  dark background in order to have sufficient contrast.
                </p>
                <p>
                  <Link href="#" className="link-primary" aria-label="Primary link example">
                    Primary link
                  </Link>
                </p>
                <p>
                  <Link href="#" className="link-secondary" aria-label="Secondary link example">
                    Secondary link
                  </Link>
                </p>
                <p>
                  <Link href="#" className="link-success" aria-label="Success link example">
                    Success link
                  </Link>
                </p>
                <p>
                  <Link href="#" className="link-danger" aria-label="Danger link example">
                    Danger link
                  </Link>
                </p>
                <p>
                  <Link href="#" className="link-warning" aria-label="Warning link example">
                    Warning link
                  </Link>
                </p>
                <p>
                  <Link href="#" className="link-info" aria-label="Info link example">
                    Info link
                  </Link>
                </p>
                <p>
                  <Link href="#" className="link-light" aria-label="Light link example">
                    Light link
                  </Link>
                </p>
                <p>
                  <Link href="#" className="link-dark" aria-label="Dark link example">
                    Dark link
                  </Link>
                </p>
                <p className="mb-0">
                  <Link href="#" className="link-body-emphasis" aria-label="Emphasis link example">
                    Emphasis link
                  </Link>
                </p>
              </div>{" "}
              {/* end card body */}
            </div>{" "}
            {/* end card */}
          </div>{" "}
          {/* end col */}
          <div className="col-xl-6">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title">Link utilities</h5>
              </div>
              <div className="card-body">
                <p className="text-muted">
                  <Link href="#" aria-label="Colored link helpers documentation">Colored link helpers</Link> have been
                  updated to pair with our link utilities. Use the new utilities
                  to modify the link opacity, underline opacity, and underline
                  offset.
                </p>
                <p>
                  <Link
                    href="#"
                    className="link-primary text-decoration-underline link-offset-2 link-underline-opacity-25 link-underline-opacity-100-hover"
                  >
                    Primary link
                  </Link>
                </p>
                <p>
                  <Link
                    href="#"
                    className="link-secondary text-decoration-underline link-offset-2 link-underline-opacity-25 link-underline-opacity-100-hover"
                  >
                    Secondary link
                  </Link>
                </p>
                <p>
                  <Link
                    href="#"
                    className="link-success text-decoration-underline link-offset-2 link-underline-opacity-25 link-underline-opacity-100-hover"
                  >
                    Success link
                  </Link>
                </p>
                <p>
                  <Link
                    href="#"
                    className="link-danger text-decoration-underline link-offset-2 link-underline-opacity-25 link-underline-opacity-100-hover"
                  >
                    Danger link
                  </Link>
                </p>
                <p>
                  <Link
                    href="#"
                    className="link-warning text-decoration-underline link-offset-2 link-underline-opacity-25 link-underline-opacity-100-hover"
                  >
                    Warning link
                  </Link>
                </p>
                <p>
                  <Link
                    href="#"
                    className="link-info text-decoration-underline link-offset-2 link-underline-opacity-25 link-underline-opacity-100-hover"
                  >
                    Info link
                  </Link>
                </p>
                <p>
                  <Link
                    href="#"
                    className="link-light text-decoration-underline link-offset-2 link-underline-opacity-25 link-underline-opacity-100-hover"
                  >
                    Light link
                  </Link>
                </p>
                <p>
                  <Link
                    href="#"
                    className="link-dark text-decoration-underline link-offset-2 link-underline-opacity-25 link-underline-opacity-100-hover"
                  >
                    Dark link
                  </Link>
                </p>
                <p>
                  <Link
                    href="#"
                    className="link-body-emphasis text-decoration-underline link-offset-2 link-underline-opacity-25 link-underline-opacity-75-hover"
                  >
                    Emphasis link
                  </Link>
                </p>
              </div>{" "}
              {/* end card body */}
            </div>{" "}
            {/* end card */}
          </div>{" "}
          {/* end col */}
        </div>
        {/* end row */}
        {/* start row */}
        <div className="row">
          <div className="col-xl-6">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title">Link opacity</h5>
              </div>
              <div className="card-body">
                <p className="text-muted">
                  Change the alpha opacity of the link <code>rgba()</code> color
                  value with utilities. Please be aware that changes to a color’s
                  opacity can lead to links with <em>insufficient</em> contrast.
                </p>
                <p>
                  <Link className="link-opacity-10" href="#" aria-label="Link with 10% opacity">
                    Link opacity 10
                  </Link>
                </p>
                <p>
                  <Link className="link-opacity-25" href="#" aria-label="Link with 25% opacity">
                    Link opacity 25
                  </Link>
                </p>
                <p>
                  <Link className="link-opacity-50" href="#" aria-label="Link with 50% opacity">
                    Link opacity 50
                  </Link>
                </p>
                <p>
                  <Link className="link-opacity-75" href="#" aria-label="Link with 75% opacity">
                    Link opacity 75
                  </Link>
                </p>
                <p className="mb-0">
                  <Link className="link-opacity-100" href="#" aria-label="Link with 100% opacity">
                    Link opacity 100
                  </Link>
                </p>
              </div>{" "}
              {/* end card body */}
            </div>{" "}
            {/* end card */}
          </div>{" "}
          {/* end col */}
          <div className="col-xl-6">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title">Link hover opacity</h5>
              </div>
              <div className="card-body">
                <p className="text-muted">
                  You can even change the opacity level on hover.
                </p>
                <p>
                  <Link className="link-opacity-10-hover" href="#" aria-label="Link with 10% hover opacity">
                    Link hover opacity 10
                  </Link>
                </p>
                <p>
                  <Link className="link-opacity-25-hover" href="#" aria-label="Link with 25% hover opacity">
                    Link hover opacity 25
                  </Link>
                </p>
                <p>
                  <Link className="link-opacity-50-hover" href="#" aria-label="Link with 50% hover opacity">
                    Link hover opacity 50
                  </Link>
                </p>
                <p>
                  <Link className="link-opacity-75-hover" href="#" aria-label="Link with 75% hover opacity">
                    Link hover opacity 75
                  </Link>
                </p>
                <p className="mb-0">
                  <Link className="link-opacity-100-hover" href="#" aria-label="Link with 100% hover opacity">
                    Link hover opacity 100
                  </Link>
                </p>
              </div>{" "}
              {/* end card body */}
            </div>{" "}
            {/* end card */}
          </div>{" "}
          {/* end col */}
        </div>
        {/*end row*/}
        {/* start row */}
        <div className="row">
          <div className="col-xl-6">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title">Underline color</h5>
              </div>
              <div className="card-body">
                <p className="text-muted">
                  Change the underline’s color independent of the link text color.
                </p>
                <p>
                  <Link
                    href="#"
                    className="text-decoration-underline link-underline-primary"
                  >
                    Primary underline
                  </Link>
                </p>
                <p>
                  <Link
                    href="#"
                    className="text-decoration-underline link-underline-secondary"
                  >
                    Secondary underline
                  </Link>
                </p>
                <p>
                  <Link
                    href="#"
                    className="text-decoration-underline link-underline-success"
                  >
                    Success underline
                  </Link>
                </p>
                <p>
                  <Link
                    href="#"
                    className="text-decoration-underline link-underline-danger"
                  >
                    Danger underline
                  </Link>
                </p>
                <p>
                  <Link
                    href="#"
                    className="text-decoration-underline link-underline-warning"
                  >
                    Warning underline
                  </Link>
                </p>
                <p>
                  <Link
                    href="#"
                    className="text-decoration-underline link-underline-info"
                  >
                    Info underline
                  </Link>
                </p>
                <p>
                  <Link
                    href="#"
                    className="text-decoration-underline link-underline-light"
                  >
                    Light underline
                  </Link>
                </p>
                <p className="mb-0">
                  <Link
                    href="#"
                    className="text-decoration-underline link-underline-dark"
                  >
                    Dark underline
                  </Link>
                </p>
              </div>{" "}
              {/* end card body */}
            </div>{" "}
            {/* end card */}
          </div>{" "}
          {/* end col */}
          <div className="col-xl-6">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title">Underline opacity</h5>
              </div>
              <div className="card-body">
                <p className="text-muted">
                  Change the underline’s opacity. Requires adding{" "}
                  <code>.link-underline</code> to first set an <code>rgba()</code>{" "}
                  color we use to then modify the alpha opacity.
                </p>
                <p>
                  <Link
                    className="text-decoration-underline link-offset-2 link-underline link-underline-opacity-0"
                    href="#"
                  >
                    Underline opacity 0
                  </Link>
                </p>
                <p>
                  <Link
                    className="text-decoration-underline link-offset-2 link-underline link-underline-opacity-10"
                    href="#"
                  >
                    Underline opacity 10
                  </Link>
                </p>
                <p>
                  <Link
                    className="text-decoration-underline link-offset-2 link-underline link-underline-opacity-25"
                    href="#"
                  >
                    Underline opacity 25
                  </Link>
                </p>
                <p>
                  <Link
                    className="text-decoration-underline link-offset-2 link-underline link-underline-opacity-50"
                    href="#"
                  >
                    Underline opacity 50
                  </Link>
                </p>
                <p>
                  <Link
                    className="text-decoration-underline link-offset-2 link-underline link-underline-opacity-75"
                    href="#"
                  >
                    Underline opacity 75
                  </Link>
                </p>
                <p className="mb-0">
                  <Link
                    className="text-decoration-underline link-offset-2 link-underline link-underline-opacity-100"
                    href="#"
                  >
                    Underline opacity 100
                  </Link>
                </p>
              </div>{" "}
              {/* end card body */}
            </div>{" "}
            {/* end card */}
          </div>{" "}
          {/* end col */}
        </div>
        {/* end row */}
        {/* start row */}
        <div className="row">
          <div className="col-xl-6">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title">Underline offset</h5>
              </div>
              <div className="card-body">
                <p className="text-muted">
                  Change the underline’s opacity. Requires adding{" "}
                  <code>.link-underline</code> to first set an <code>rgba()</code>{" "}
                  color we use to then modify the alpha opacity.
                </p>
                <p>
                  <Link href="#" aria-label="Default link example">Default link</Link>
                </p>
                <p>
                  <Link className="text-decoration-underline link-offset-1" href="#">
                    Offset 1 link
                  </Link>
                </p>
                <p>
                  <Link className="text-decoration-underline link-offset-2" href="#">
                    Offset 2 link
                  </Link>
                </p>
                <p className="mb-0">
                  <Link className="text-decoration-underline link-offset-3" href="#">
                    Offset 3 link
                  </Link>
                </p>
              </div>{" "}
              {/* end card body */}
            </div>{" "}
            {/* end card */}
          </div>{" "}
          {/* end col */}
          <div className="col-xl-6">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title">Hover variants</h5>
              </div>
              <div className="card-body">
                <p className="text-muted">
                  Just like the <code>.link-opacity-*-hover</code> utilities,{" "}
                  <code>.link-offset</code> and{" "}
                  <code>.link-underline-opacity</code> utilities include{" "}
                  <code>:hover</code> variants by default. Mix and match to create
                  unique link styles.
                </p>
                <Link
                  className="link-offset-2 link-offset-3-hover text-decoration-underline link-underline link-underline-opacity-0 link-underline-opacity-75-hover"
                  href="#"
                >
                  Underline opacity 0
                </Link>
              </div>{" "}
              {/* end card body */}
            </div>{" "}
            {/* end card */}
          </div>{" "}
          {/* end col */}
        </div>
        {/*end row */}
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

export default UiLinksComponent