"use client";
import Link from "next/link";
import ContactModal from "./contactModal"
import { all_routes } from "@/router/all_routes";
import ImageWithBasePath from "@/core/common-components/image-with-base-path";
import CommonFooter from "@/core/common-components/common-footer/commonFooter";


const ContactsComponent = () => {
  return (
    <>
    {/* ========================
              Start Page Content
          ========================= */}
    <div className="page-wrapper">
      {/* Start Content */}
      <div className="content pb-0">
        {/* Page Header */}
        <div className="d-flex align-items-center justify-content-between gap-2 mb-4 flex-wrap">
          <div className="breadcrumb-arrow">
            <h4 className="mb-1">Contact</h4>
            <div className="text-end">
              <ol className="breadcrumb m-0 py-0">
                <li className="breadcrumb-item">
                  <Link href={all_routes.dashboard}>Home</Link>
                </li>
                <li className="breadcrumb-item">
                  <Link href="#">Applications</Link>
                </li>
                <li className="breadcrumb-item active">Contact</li>
              </ol>
            </div>
          </div>
          <div className="gap-2 d-flex align-items-center flex-wrap">
            <Link
              href={all_routes.contacts}
              className="btn btn-icon btn-white active"
              data-bs-toggle="tooltip"
              data-bs-placement="top"
              aria-label="Grid"
              data-bs-original-title="Grid View"
            >
              <i className="ti ti-layout-grid" />
            </Link>
            <Link
              href={all_routes.contactList}
              className="btn btn-icon btn-white"
              data-bs-toggle="tooltip"
              data-bs-placement="top"
              aria-label="List"
              data-bs-original-title="List View"
            >
              <i className="ti ti-layout-list" />
            </Link>
            <Link
              href="#"
              className="btn btn-primary"
              data-bs-toggle="modal"
              data-bs-target="#add_modal"
            >
              <i className="ti ti-square-rounded-plus me-1" />
              New Contact
            </Link>
          </div>
        </div>
        {/* End Page Header */}
        <div className="row">
          <div className="col-xxl-3 col-xl-4 col-md-6">
            <div className="card">
              <div className="card-body">
                <div className="d-flex align-items-center mb-3">
                  <Link
                    href="#"
                    className="avatar flex-shrink-0 me-2"
                  >
                    <ImageWithBasePath src="assets/img/chat/chat-user-16.jpg" alt="user" />
                  </Link>
                  <div>
                    <h6 className="fs-14 fw-semibold mb-1">
                      <Link href="#">James Jackson</Link>
                    </h6>
                    <p className="fs-13 mb-0">jamesjackson@example.com</p>
                  </div>
                </div>
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <Link href={all_routes.voiceCall} className="btn btn-icon btn-light" aria-label="Voice Call">
                      <i className="ti ti-phone-calling" />
                    </Link>
                    <Link href={all_routes.chat} className="btn btn-icon btn-light" aria-label="Chat">
                      <i className="ti ti-message-chatbot" />
                    </Link>
                    <Link href={all_routes.videoCall} className="btn btn-icon btn-light" aria-label="Video Call">
                      <i className="ti ti-video-plus" />
                    </Link>
                  </div>
                  <div>
                    <Link
                      href="#"
                      className="btn btn-icon btn-outline-light"
                      data-bs-toggle="dropdown"
                     aria-label="Lab result actions menu" aria-haspopup="true" aria-expanded="false">
                      <i className="ti ti-dots-vertical" aria-hidden="true" />
                    </Link>
                    <ul className="dropdown-menu p-2">
                      <li>
                        <Link
                          href="#"
                          className="dropdown-item d-flex align-items-center"
                          data-bs-toggle="modal"
                          data-bs-target="#edit_modal"
                        >
                          <i className="ti ti-edit me-1" />
                          Edit
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="#"
                          className="dropdown-item d-flex align-items-center"
                          data-bs-toggle="modal"
                          data-bs-target="#delete_modal"
                        >
                          <i className="ti ti-trash me-1" />
                          Delete
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xxl-3 col-xl-4 col-md-6">
            <div className="card">
              <div className="card-body">
                <div className="d-flex align-items-center mb-3">
                  <Link
                    href="#"
                    className="avatar flex-shrink-0 me-2"
                  >
                    <ImageWithBasePath src="assets/img/chat/chat-user-07.jpg" alt="user" />
                  </Link>
                  <div>
                    <h6 className="fs-14 fw-semibold mb-1">
                      <Link href="#">Robin Coffin</Link>
                    </h6>
                    <p className="fs-13 mb-0">robin@example.com</p>
                  </div>
                </div>
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <Link href={all_routes.voiceCall} className="btn btn-icon btn-light" aria-label="Voice Call">
                      <i className="ti ti-phone-calling" />
                    </Link>
                    <Link href={all_routes.chat} className="btn btn-icon btn-light" aria-label="Chat">
                      <i className="ti ti-message-chatbot" />
                    </Link>
                    <Link href={all_routes.videoCall} className="btn btn-icon btn-light" aria-label="Video Call">
                      <i className="ti ti-video-plus" />
                    </Link>
                  </div>
                  <div>
                    <Link
                      href="#"
                      className="btn btn-icon btn-outline-light"
                      data-bs-toggle="dropdown"
                     aria-label="Lab result actions menu" aria-haspopup="true" aria-expanded="false">
                      <i className="ti ti-dots-vertical" aria-hidden="true" />
                    </Link>
                    <ul className="dropdown-menu p-2">
                      <li>
                        <Link
                          href="#"
                          className="dropdown-item d-flex align-items-center"
                          data-bs-toggle="modal"
                          data-bs-target="#edit_modal"
                        >
                          <i className="ti ti-edit me-1" />
                          Edit
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="#"
                          className="dropdown-item d-flex align-items-center"
                          data-bs-toggle="modal"
                          data-bs-target="#delete_modal"
                        >
                          <i className="ti ti-trash me-1" />
                          Delete
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xxl-3 col-xl-4 col-md-6">
            <div className="card">
              <div className="card-body">
                <div className="d-flex align-items-center mb-3">
                  <Link
                    href="#"
                    className="avatar flex-shrink-0 me-2"
                  >
                    <ImageWithBasePath src="assets/img/chat/chat-user-02.jpg" alt="user" />
                  </Link>
                  <div>
                    <h6 className="fs-14 fw-semibold mb-1">
                      <Link href="#">Vincent Thornburg</Link>
                    </h6>
                    <p className="fs-13 mb-0">vincent@example.com</p>
                  </div>
                </div>
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <Link href={all_routes.voiceCall} className="btn btn-icon btn-light" aria-label="Voice Call">
                      <i className="ti ti-phone-calling" />
                    </Link>
                    <Link href={all_routes.chat} className="btn btn-icon btn-light" aria-label="Chat">
                      <i className="ti ti-message-chatbot" />
                    </Link>
                    <Link href={all_routes.videoCall} className="btn btn-icon btn-light" aria-label="Video Call">
                      <i className="ti ti-video-plus" />
                    </Link>
                  </div>
                  <div>
                    <Link
                      href="#"
                      className="btn btn-icon btn-outline-light"
                      data-bs-toggle="dropdown"
                     aria-label="Lab result actions menu" aria-haspopup="true" aria-expanded="false">
                      <i className="ti ti-dots-vertical" aria-hidden="true" />
                    </Link>
                    <ul className="dropdown-menu p-2">
                      <li>
                        <Link
                          href="#"
                          className="dropdown-item d-flex align-items-center"
                          data-bs-toggle="modal"
                          data-bs-target="#edit_modal"
                        >
                          <i className="ti ti-edit me-1" />
                          Edit
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="#"
                          className="dropdown-item d-flex align-items-center"
                          data-bs-toggle="modal"
                          data-bs-target="#delete_modal"
                        >
                          <i className="ti ti-trash me-1" />
                          Delete
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xxl-3 col-xl-4 col-md-6">
            <div className="card">
              <div className="card-body">
                <div className="d-flex align-items-center mb-3">
                  <Link
                    href="#"
                    className="avatar flex-shrink-0 me-2"
                  >
                    <ImageWithBasePath src="assets/img/chat/chat-user-05.jpg" alt="user" />
                  </Link>
                  <div>
                    <h6 className="fs-14 fw-semibold mb-1">
                      <Link href="#">Fran Faulkner</Link>
                    </h6>
                    <p className="fs-13 mb-0">franfaulkner@example.com</p>
                  </div>
                </div>
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <Link href={all_routes.voiceCall} className="btn btn-icon btn-light" aria-label="Voice Call">
                      <i className="ti ti-phone-calling" />
                    </Link>
                    <Link href={all_routes.chat} className="btn btn-icon btn-light" aria-label="Chat">
                      <i className="ti ti-message-chatbot" />
                    </Link>
                    <Link href={all_routes.videoCall} className="btn btn-icon btn-light" aria-label="Video Call">
                      <i className="ti ti-video-plus" />
                    </Link>
                  </div>
                  <div>
                    <Link
                      href="#"
                      className="btn btn-icon btn-outline-light"
                      data-bs-toggle="dropdown"
                     aria-label="Lab result actions menu" aria-haspopup="true" aria-expanded="false">
                      <i className="ti ti-dots-vertical" aria-hidden="true" />
                    </Link>
                    <ul className="dropdown-menu p-2">
                      <li>
                        <Link
                          href="#"
                          className="dropdown-item d-flex align-items-center"
                          data-bs-toggle="modal"
                          data-bs-target="#edit_modal"
                        >
                          <i className="ti ti-edit me-1" />
                          Edit
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="#"
                          className="dropdown-item d-flex align-items-center"
                          data-bs-toggle="modal"
                          data-bs-target="#delete_modal"
                        >
                          <i className="ti ti-trash me-1" />
                          Delete
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xxl-3 col-xl-4 col-md-6">
            <div className="card">
              <div className="card-body">
                <div className="d-flex align-items-center mb-3">
                  <Link
                    href="#"
                    className="avatar flex-shrink-0 me-2"
                  >
                    <ImageWithBasePath src="assets/img/chat/chat-user-04.jpg" alt="user" />
                  </Link>
                  <div>
                    <h6 className="fs-14 fw-semibold mb-1">
                      <Link href="#">Ernestine Waller</Link>
                    </h6>
                    <p className="fs-13 mb-0">Waller@example.com</p>
                  </div>
                </div>
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <Link href={all_routes.voiceCall} className="btn btn-icon btn-light" aria-label="Voice Call">
                      <i className="ti ti-phone-calling" />
                    </Link>
                    <Link href={all_routes.chat} className="btn btn-icon btn-light" aria-label="Chat">
                      <i className="ti ti-message-chatbot" />
                    </Link>
                    <Link href={all_routes.videoCall} className="btn btn-icon btn-light" aria-label="Video Call">
                      <i className="ti ti-video-plus" />
                    </Link>
                  </div>
                  <div>
                    <Link
                      href="#"
                      className="btn btn-icon btn-outline-light"
                      data-bs-toggle="dropdown"
                     aria-label="Lab result actions menu" aria-haspopup="true" aria-expanded="false">
                      <i className="ti ti-dots-vertical" aria-hidden="true" />
                    </Link>
                    <ul className="dropdown-menu p-2">
                      <li>
                        <Link
                          href="#"
                          className="dropdown-item d-flex align-items-center"
                          data-bs-toggle="modal"
                          data-bs-target="#edit_modal"
                        >
                          <i className="ti ti-edit me-1" />
                          Edit
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="#"
                          className="dropdown-item d-flex align-items-center"
                          data-bs-toggle="modal"
                          data-bs-target="#delete_modal"
                        >
                          <i className="ti ti-trash me-1" />
                          Delete
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xxl-3 col-xl-4 col-md-6">
            <div className="card">
              <div className="card-body">
                <div className="d-flex align-items-center mb-3">
                  <Link
                    href="#"
                    className="avatar flex-shrink-0 me-2"
                  >
                    <ImageWithBasePath src="assets/img/chat/chat-user-17.jpg" alt="user" />
                  </Link>
                  <div>
                    <h6 className="fs-14 fw-semibold mb-1">
                      <Link href="#">Jared Adams</Link>
                    </h6>
                    <p className="fs-13 mb-0">jaredadams@example.com</p>
                  </div>
                </div>
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <Link href={all_routes.voiceCall} className="btn btn-icon btn-light" aria-label="Voice Call">
                      <i className="ti ti-phone-calling" />
                    </Link>
                    <Link href={all_routes.chat} className="btn btn-icon btn-light" aria-label="Chat">
                      <i className="ti ti-message-chatbot" />
                    </Link>
                    <Link href={all_routes.videoCall} className="btn btn-icon btn-light" aria-label="Video Call">
                      <i className="ti ti-video-plus" />
                    </Link>
                  </div>
                  <div>
                    <Link
                      href="#"
                      className="btn btn-icon btn-outline-light"
                      data-bs-toggle="dropdown"
                     aria-label="Lab result actions menu" aria-haspopup="true" aria-expanded="false">
                      <i className="ti ti-dots-vertical" aria-hidden="true" />
                    </Link>
                    <ul className="dropdown-menu p-2">
                      <li>
                        <Link
                          href="#"
                          className="dropdown-item d-flex align-items-center"
                          data-bs-toggle="modal"
                          data-bs-target="#edit_modal"
                        >
                          <i className="ti ti-edit me-1" />
                          Edit
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="#"
                          className="dropdown-item d-flex align-items-center"
                          data-bs-toggle="modal"
                          data-bs-target="#delete_modal"
                        >
                          <i className="ti ti-trash me-1" />
                          Delete
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xxl-3 col-xl-4 col-md-6">
            <div className="card">
              <div className="card-body">
                <div className="d-flex align-items-center mb-3">
                  <Link
                    href="#"
                    className="avatar flex-shrink-0 me-2"
                  >
                    <ImageWithBasePath src="assets/img/chat/chat-user-10.jpg" alt="user" />
                  </Link>
                  <div>
                    <h6 className="fs-14 fw-semibold mb-1">
                      <Link href="#">Reyna Pelfrey</Link>
                    </h6>
                    <p className="fs-13 mb-0">renyapelfrey@example.com</p>
                  </div>
                </div>
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <Link href={all_routes.voiceCall} className="btn btn-icon btn-light" aria-label="Voice Call">
                      <i className="ti ti-phone-calling" />
                    </Link>
                    <Link href={all_routes.chat} className="btn btn-icon btn-light" aria-label="Chat">
                      <i className="ti ti-message-chatbot" />
                    </Link>
                    <Link href={all_routes.videoCall} className="btn btn-icon btn-light" aria-label="Video Call">
                      <i className="ti ti-video-plus" />
                    </Link>
                  </div>
                  <div>
                    <Link
                      href="#"
                      className="btn btn-icon btn-outline-light"
                      data-bs-toggle="dropdown"
                     aria-label="Lab result actions menu" aria-haspopup="true" aria-expanded="false">
                      <i className="ti ti-dots-vertical" aria-hidden="true" />
                    </Link>
                    <ul className="dropdown-menu p-2">
                      <li>
                        <Link
                          href="#"
                          className="dropdown-item d-flex align-items-center"
                          data-bs-toggle="modal"
                          data-bs-target="#edit_modal"
                        >
                          <i className="ti ti-edit me-1" />
                          Edit
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="#"
                          className="dropdown-item d-flex align-items-center"
                          data-bs-toggle="modal"
                          data-bs-target="#delete_modal"
                        >
                          <i className="ti ti-trash me-1" />
                          Delete
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xxl-3 col-xl-4 col-md-6">
            <div className="card">
              <div className="card-body">
                <div className="d-flex align-items-center mb-3">
                  <Link
                    href="#"
                    className="avatar flex-shrink-0 me-2"
                  >
                    <ImageWithBasePath src="assets/img/chat/chat-user-09.jpg" alt="user" />
                  </Link>
                  <div>
                    <h6 className="fs-14 fw-semibold mb-1">
                      <Link href="#">Rafael Lowe</Link>
                    </h6>
                    <p className="fs-13 mb-0">rafeallowe@example.com</p>
                  </div>
                </div>
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <Link href={all_routes.voiceCall} className="btn btn-icon btn-light" aria-label="Voice Call">
                      <i className="ti ti-phone-calling" />
                    </Link>
                    <Link href={all_routes.chat} className="btn btn-icon btn-light" aria-label="Chat">
                      <i className="ti ti-message-chatbot" />
                    </Link>
                    <Link href={all_routes.videoCall} className="btn btn-icon btn-light" aria-label="Video Call">
                      <i className="ti ti-video-plus" />
                    </Link>
                  </div>
                  <div>
                    <Link
                      href="#"
                      className="btn btn-icon btn-outline-light"
                      data-bs-toggle="dropdown"
                     aria-label="Lab result actions menu" aria-haspopup="true" aria-expanded="false">
                      <i className="ti ti-dots-vertical" aria-hidden="true" />
                    </Link>
                    <ul className="dropdown-menu p-2">
                      <li>
                        <Link
                          href="#"
                          className="dropdown-item d-flex align-items-center"
                          data-bs-toggle="modal"
                          data-bs-target="#edit_modal"
                        >
                          <i className="ti ti-edit me-1" />
                          Edit
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="#"
                          className="dropdown-item d-flex align-items-center"
                          data-bs-toggle="modal"
                          data-bs-target="#delete_modal"
                        >
                          <i className="ti ti-trash me-1" />
                          Delete
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xxl-3 col-xl-4 col-md-6">
            <div className="card">
              <div className="card-body">
                <div className="d-flex align-items-center mb-3">
                  <Link
                    href="#"
                    className="avatar flex-shrink-0 me-2"
                  >
                    <ImageWithBasePath src="assets/img/chat/chat-user-18.jpg" alt="user" />
                  </Link>
                  <div>
                    <h6 className="fs-14 fw-semibold mb-1">
                      <Link href="#">Enrique Ratcliff</Link>
                    </h6>
                    <p className="fs-13 mb-0">enrique@example.com</p>
                  </div>
                </div>
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <Link href={all_routes.voiceCall} className="btn btn-icon btn-light" aria-label="Voice Call">
                      <i className="ti ti-phone-calling" />
                    </Link>
                    <Link href={all_routes.chat} className="btn btn-icon btn-light" aria-label="Chat">
                      <i className="ti ti-message-chatbot" />
                    </Link>
                    <Link href={all_routes.videoCall} className="btn btn-icon btn-light" aria-label="Video Call">
                      <i className="ti ti-video-plus" />
                    </Link>
                  </div>
                  <div>
                    <Link
                      href="#"
                      className="btn btn-icon btn-outline-light"
                      data-bs-toggle="dropdown"
                     aria-label="Lab result actions menu" aria-haspopup="true" aria-expanded="false">
                      <i className="ti ti-dots-vertical" aria-hidden="true" />
                    </Link>
                    <ul className="dropdown-menu p-2">
                      <li>
                        <Link
                          href="#"
                          className="dropdown-item d-flex align-items-center"
                          data-bs-toggle="modal"
                          data-bs-target="#edit_modal"
                        >
                          <i className="ti ti-edit me-1" />
                          Edit
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="#"
                          className="dropdown-item d-flex align-items-center"
                          data-bs-toggle="modal"
                          data-bs-target="#delete_modal"
                        >
                          <i className="ti ti-trash me-1" />
                          Delete
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xxl-3 col-xl-4 col-md-6">
            <div className="card">
              <div className="card-body">
                <div className="d-flex align-items-center mb-3">
                  <Link
                    href="#"
                    className="avatar flex-shrink-0 me-2"
                  >
                    <ImageWithBasePath src="assets/img/chat/chat-user-08.jpg" alt="user" />
                  </Link>
                  <div>
                    <h6 className="fs-14 fw-semibold mb-1">
                      <Link href="#">Elizabeth Pegues</Link>
                    </h6>
                    <p className="fs-13 mb-0">elizabeth@example.com</p>
                  </div>
                </div>
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <Link href={all_routes.voiceCall} className="btn btn-icon btn-light" aria-label="Voice Call">
                      <i className="ti ti-phone-calling" />
                    </Link>
                    <Link href={all_routes.chat} className="btn btn-icon btn-light" aria-label="Chat">
                      <i className="ti ti-message-chatbot" />
                    </Link>
                    <Link href={all_routes.videoCall} className="btn btn-icon btn-light" aria-label="Video Call">
                      <i className="ti ti-video-plus" />
                    </Link>
                  </div>
                  <div>
                    <Link
                      href="#"
                      className="btn btn-icon btn-outline-light"
                      data-bs-toggle="dropdown"
                     aria-label="Lab result actions menu" aria-haspopup="true" aria-expanded="false">
                      <i className="ti ti-dots-vertical" aria-hidden="true" />
                    </Link>
                    <ul className="dropdown-menu p-2">
                      <li>
                        <Link
                          href="#"
                          className="dropdown-item d-flex align-items-center"
                          data-bs-toggle="modal"
                          data-bs-target="#edit_modal"
                        >
                          <i className="ti ti-edit me-1" />
                          Edit
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="#"
                          className="dropdown-item d-flex align-items-center"
                          data-bs-toggle="modal"
                          data-bs-target="#delete_modal"
                        >
                          <i className="ti ti-trash me-1" />
                          Delete
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xxl-3 col-xl-4 col-md-6">
            <div className="card">
              <div className="card-body">
                <div className="d-flex align-items-center mb-3">
                  <Link
                    href="#"
                    className="avatar flex-shrink-0 me-2"
                  >
                    <ImageWithBasePath src="assets/img/chat/chat-user-19.jpg" alt="user" />
                  </Link>
                  <div>
                    <h6 className="fs-14 fw-semibold mb-1">
                      <Link href="#">Jenna Alford</Link>
                    </h6>
                    <p className="fs-13 mb-0">jennaalford@example.com</p>
                  </div>
                </div>
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <Link href={all_routes.voiceCall} className="btn btn-icon btn-light" aria-label="Voice Call">
                      <i className="ti ti-phone-calling" />
                    </Link>
                    <Link href={all_routes.chat} className="btn btn-icon btn-light" aria-label="Chat">
                      <i className="ti ti-message-chatbot" />
                    </Link>
                    <Link href={all_routes.videoCall} className="btn btn-icon btn-light" aria-label="Video Call">
                      <i className="ti ti-video-plus" />
                    </Link>
                  </div>
                  <div>
                    <Link
                      href="#"
                      className="btn btn-icon btn-outline-light"
                      data-bs-toggle="dropdown"
                     aria-label="Lab result actions menu" aria-haspopup="true" aria-expanded="false">
                      <i className="ti ti-dots-vertical" aria-hidden="true" />
                    </Link>
                    <ul className="dropdown-menu p-2">
                      <li>
                        <Link
                          href="#"
                          className="dropdown-item d-flex align-items-center"
                          data-bs-toggle="modal"
                          data-bs-target="#edit_modal"
                        >
                          <i className="ti ti-edit me-1" />
                          Edit
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="#"
                          className="dropdown-item d-flex align-items-center"
                          data-bs-toggle="modal"
                          data-bs-target="#delete_modal"
                        >
                          <i className="ti ti-trash me-1" />
                          Delete
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xxl-3 col-xl-4 col-md-6">
            <div className="card">
              <div className="card-body">
                <div className="d-flex align-items-center mb-3">
                  <Link
                    href="#"
                    className="avatar flex-shrink-0 me-2"
                  >
                    <ImageWithBasePath src="assets/img/chat/chat-user-20.jpg" alt="user" />
                  </Link>
                  <div>
                    <h6 className="fs-14 fw-semibold mb-1">
                      <Link href="#">Teresa Boggs</Link>
                    </h6>
                    <p className="fs-13 mb-0">teresaboggs@example.com</p>
                  </div>
                </div>
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <Link href={all_routes.voiceCall} className="btn btn-icon btn-light" aria-label="Voice Call">
                      <i className="ti ti-phone-calling" />
                    </Link>
                    <Link href={all_routes.chat} className="btn btn-icon btn-light" aria-label="Chat">
                      <i className="ti ti-message-chatbot" />
                    </Link>
                    <Link href={all_routes.videoCall} className="btn btn-icon btn-light" aria-label="Video Call">
                      <i className="ti ti-video-plus" />
                    </Link>
                  </div>
                  <div>
                    <Link
                      href="#"
                      className="btn btn-icon btn-outline-light"
                      data-bs-toggle="dropdown"
                     aria-label="Lab result actions menu" aria-haspopup="true" aria-expanded="false">
                      <i className="ti ti-dots-vertical" aria-hidden="true" />
                    </Link>
                    <ul className="dropdown-menu p-2">
                      <li>
                        <Link
                          href="#"
                          className="dropdown-item d-flex align-items-center"
                          data-bs-toggle="modal"
                          data-bs-target="#edit_modal"
                        >
                          <i className="ti ti-edit me-1" />
                          Edit
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="#"
                          className="dropdown-item d-flex align-items-center"
                          data-bs-toggle="modal"
                          data-bs-target="#delete_modal"
                        >
                          <i className="ti ti-trash me-1" />
                          Delete
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xxl-3 col-xl-4 col-md-6">
            <div className="card">
              <div className="card-body">
                <div className="d-flex align-items-center mb-3">
                  <Link
                    href="#"
                    className="avatar flex-shrink-0 me-2"
                  >
                    <ImageWithBasePath src="assets/img/chat/chat-user-21.jpg" alt="user" />
                  </Link>
                  <div>
                    <h6 className="fs-14 fw-semibold mb-1">
                      <Link href="#">Doris Lees</Link>
                    </h6>
                    <p className="fs-13 mb-0">dorislees@example.com</p>
                  </div>
                </div>
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <Link href={all_routes.voiceCall} className="btn btn-icon btn-light" aria-label="Voice Call">
                      <i className="ti ti-phone-calling" />
                    </Link>
                    <Link href={all_routes.chat} className="btn btn-icon btn-light" aria-label="Chat">
                      <i className="ti ti-message-chatbot" />
                    </Link>
                    <Link href={all_routes.videoCall} className="btn btn-icon btn-light" aria-label="Video Call">
                      <i className="ti ti-video-plus" />
                    </Link>
                  </div>
                  <div>
                    <Link
                      href="#"
                      className="btn btn-icon btn-outline-light"
                      data-bs-toggle="dropdown"
                     aria-label="Lab result actions menu" aria-haspopup="true" aria-expanded="false">
                      <i className="ti ti-dots-vertical" aria-hidden="true" />
                    </Link>
                    <ul className="dropdown-menu p-2">
                      <li>
                        <Link
                          href="#"
                          className="dropdown-item d-flex align-items-center"
                          data-bs-toggle="modal"
                          data-bs-target="#edit_modal"
                        >
                          <i className="ti ti-edit me-1" />
                          Edit
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="#"
                          className="dropdown-item d-flex align-items-center"
                          data-bs-toggle="modal"
                          data-bs-target="#delete_modal"
                        >
                          <i className="ti ti-trash me-1" />
                          Delete
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xxl-3 col-xl-4 col-md-6">
            <div className="card">
              <div className="card-body">
                <div className="d-flex align-items-center mb-3">
                  <Link
                    href="#"
                    className="avatar flex-shrink-0 me-2"
                  >
                    <ImageWithBasePath src="assets/img/chat/chat-user-22.jpg" alt="user" />
                  </Link>
                  <div>
                    <h6 className="fs-14 fw-semibold mb-1">
                      <Link href="#">Michael Anderson</Link>
                    </h6>
                    <p className="fs-13 mb-0">michael@example.com</p>
                  </div>
                </div>
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <Link href={all_routes.voiceCall} className="btn btn-icon btn-light" aria-label="Voice Call">
                      <i className="ti ti-phone-calling" />
                    </Link>
                    <Link href={all_routes.chat} className="btn btn-icon btn-light" aria-label="Chat">
                      <i className="ti ti-message-chatbot" />
                    </Link>
                    <Link href={all_routes.videoCall} className="btn btn-icon btn-light" aria-label="Video Call">
                      <i className="ti ti-video-plus" />
                    </Link>
                  </div>
                  <div>
                    <Link
                      href="#"
                      className="btn btn-icon btn-outline-light"
                      data-bs-toggle="dropdown"
                     aria-label="Lab result actions menu" aria-haspopup="true" aria-expanded="false">
                      <i className="ti ti-dots-vertical" aria-hidden="true" />
                    </Link>
                    <ul className="dropdown-menu p-2">
                      <li>
                        <Link
                          href="#"
                          className="dropdown-item d-flex align-items-center"
                          data-bs-toggle="modal"
                          data-bs-target="#edit_modal"
                        >
                          <i className="ti ti-edit me-1" />
                          Edit
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="#"
                          className="dropdown-item d-flex align-items-center"
                          data-bs-toggle="modal"
                          data-bs-target="#delete_modal"
                        >
                          <i className="ti ti-trash me-1" />
                          Delete
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xxl-3 col-xl-4 col-md-6">
            <div className="card">
              <div className="card-body">
                <div className="d-flex align-items-center mb-3">
                  <Link
                    href="#"
                    className="avatar flex-shrink-0 me-2"
                  >
                    <ImageWithBasePath src="assets/img/chat/chat-user-06.jpg" alt="user" />
                  </Link>
                  <div>
                    <h6 className="fs-14 fw-semibold mb-1">
                      <Link href="#">jasmine</Link>
                    </h6>
                    <p className="fs-13 mb-0">jasmine@example.com</p>
                  </div>
                </div>
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <Link href={all_routes.voiceCall} className="btn btn-icon btn-light" aria-label="Voice Call">
                      <i className="ti ti-phone-calling" />
                    </Link>
                    <Link href={all_routes.chat} className="btn btn-icon btn-light" aria-label="Chat">
                      <i className="ti ti-message-chatbot" />
                    </Link>
                    <Link href={all_routes.videoCall} className="btn btn-icon btn-light" aria-label="Video Call">
                      <i className="ti ti-video-plus" />
                    </Link>
                  </div>
                  <div>
                    <Link
                      href="#"
                      className="btn btn-icon btn-outline-light"
                      data-bs-toggle="dropdown"
                     aria-label="Lab result actions menu" aria-haspopup="true" aria-expanded="false">
                      <i className="ti ti-dots-vertical" aria-hidden="true" />
                    </Link>
                    <ul className="dropdown-menu p-2">
                      <li>
                        <Link
                          href="#"
                          className="dropdown-item d-flex align-items-center"
                          data-bs-toggle="modal"
                          data-bs-target="#edit_modal"
                        >
                          <i className="ti ti-edit me-1" />
                          Edit
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="#"
                          className="dropdown-item d-flex align-items-center"
                          data-bs-toggle="modal"
                          data-bs-target="#delete_modal"
                        >
                          <i className="ti ti-trash me-1" />
                          Delete
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xxl-3 col-xl-4 col-md-6">
            <div className="card">
              <div className="card-body">
                <div className="d-flex align-items-center mb-3">
                  <Link
                    href="#"
                    className="avatar flex-shrink-0 me-2"
                  >
                    <ImageWithBasePath src="assets/img/chat/chat-user-23.jpg" alt="user" />
                  </Link>
                  <div>
                    <h6 className="fs-14 fw-semibold mb-1">
                      <Link href="#">Barbara Reynolds</Link>
                    </h6>
                    <p className="fs-13 mb-0">barbara@example.com</p>
                  </div>
                </div>
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <Link href={all_routes.voiceCall} className="btn btn-icon btn-light" aria-label="Voice Call">
                      <i className="ti ti-phone-calling" />
                    </Link>
                    <Link href={all_routes.chat} className="btn btn-icon btn-light" aria-label="Chat">
                      <i className="ti ti-message-chatbot" />
                    </Link>
                    <Link href={all_routes.videoCall} className="btn btn-icon btn-light" aria-label="Video Call">
                      <i className="ti ti-video-plus" />
                    </Link>
                  </div>
                  <div>
                    <Link
                      href="#"
                      className="btn btn-icon btn-outline-light"
                      data-bs-toggle="dropdown"
                     aria-label="Lab result actions menu" aria-haspopup="true" aria-expanded="false">
                      <i className="ti ti-dots-vertical" aria-hidden="true" />
                    </Link>
                    <ul className="dropdown-menu p-2">
                      <li>
                        <Link
                          href="#"
                          className="dropdown-item d-flex align-items-center"
                          data-bs-toggle="modal"
                          data-bs-target="#edit_modal"
                        >
                          <i className="ti ti-edit me-1" />
                          Edit
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="#"
                          className="dropdown-item d-flex align-items-center"
                          data-bs-toggle="modal"
                          data-bs-target="#delete_modal"
                        >
                          <i className="ti ti-trash me-1" />
                          Delete
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xxl-3 col-xl-4 col-md-6">
            <div className="card">
              <div className="card-body">
                <div className="d-flex align-items-center mb-3">
                  <Link
                    href="#"
                    className="avatar flex-shrink-0 me-2"
                  >
                    <ImageWithBasePath src="assets/img/chat/chat-user-11.jpg" alt="user" />
                  </Link>
                  <div>
                    <h6 className="fs-14 fw-semibold mb-1">
                      <Link href="#">Allen Snyder</Link>
                    </h6>
                    <p className="fs-13 mb-0">allensnyder@example.com</p>
                  </div>
                </div>
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <Link href={all_routes.voiceCall} className="btn btn-icon btn-light" aria-label="Voice Call">
                      <i className="ti ti-phone-calling" />
                    </Link>
                    <Link href={all_routes.chat} className="btn btn-icon btn-light" aria-label="Chat">
                      <i className="ti ti-message-chatbot" />
                    </Link>
                    <Link href={all_routes.videoCall} className="btn btn-icon btn-light" aria-label="Video Call">
                      <i className="ti ti-video-plus" />
                    </Link>
                  </div>
                  <div>
                    <Link
                      href="#"
                      className="btn btn-icon btn-outline-light"
                      data-bs-toggle="dropdown"
                     aria-label="Lab result actions menu" aria-haspopup="true" aria-expanded="false">
                      <i className="ti ti-dots-vertical" aria-hidden="true" />
                    </Link>
                    <ul className="dropdown-menu p-2">
                      <li>
                        <Link
                          href="#"
                          className="dropdown-item d-flex align-items-center"
                          data-bs-toggle="modal"
                          data-bs-target="#edit_modal"
                        >
                          <i className="ti ti-edit me-1" />
                          Edit
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="#"
                          className="dropdown-item d-flex align-items-center"
                          data-bs-toggle="modal"
                          data-bs-target="#delete_modal"
                        >
                          <i className="ti ti-trash me-1" />
                          Delete
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xxl-3 col-xl-4 col-md-6">
            <div className="card">
              <div className="card-body">
                <div className="d-flex align-items-center mb-3">
                  <Link
                    href="#"
                    className="avatar flex-shrink-0 me-2"
                  >
                    <ImageWithBasePath src="assets/img/chat/chat-user-12.jpg" alt="user" />
                  </Link>
                  <div>
                    <h6 className="fs-14 fw-semibold mb-1">
                      <Link href="#">Patrick Barnes</Link>
                    </h6>
                    <p className="fs-13 mb-0">patrick@example.com</p>
                  </div>
                </div>
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <Link href={all_routes.voiceCall} className="btn btn-icon btn-light" aria-label="Voice Call">
                      <i className="ti ti-phone-calling" />
                    </Link>
                    <Link href={all_routes.chat} className="btn btn-icon btn-light" aria-label="Chat">
                      <i className="ti ti-message-chatbot" />
                    </Link>
                    <Link href={all_routes.videoCall} className="btn btn-icon btn-light" aria-label="Video Call">
                      <i className="ti ti-video-plus" />
                    </Link>
                  </div>
                  <div>
                    <Link
                      href="#"
                      className="btn btn-icon btn-outline-light"
                      data-bs-toggle="dropdown"
                     aria-label="Lab result actions menu" aria-haspopup="true" aria-expanded="false">
                      <i className="ti ti-dots-vertical" aria-hidden="true" />
                    </Link>
                    <ul className="dropdown-menu p-2">
                      <li>
                        <Link
                          href="#"
                          className="dropdown-item d-flex align-items-center"
                          data-bs-toggle="modal"
                          data-bs-target="#edit_modal"
                        >
                          <i className="ti ti-edit me-1" />
                          Edit
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="#"
                          className="dropdown-item d-flex align-items-center"
                          data-bs-toggle="modal"
                          data-bs-target="#delete_modal"
                        >
                          <i className="ti ti-trash me-1" />
                          Delete
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xxl-3 col-xl-4 col-md-6">
            <div className="card">
              <div className="card-body">
                <div className="d-flex align-items-center mb-3">
                  <Link
                    href="#"
                    className="avatar flex-shrink-0 me-2"
                  >
                    <ImageWithBasePath src="assets/img/chat/chat-user-27.jpg" alt="user" />
                  </Link>
                  <div>
                    <h6 className="fs-14 fw-semibold mb-1">
                      <Link href="#">Lynne Paz</Link>
                    </h6>
                    <p className="fs-13 mb-0">lynnepaz@example.com</p>
                  </div>
                </div>
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <Link href={all_routes.voiceCall} className="btn btn-icon btn-light" aria-label="Voice Call">
                      <i className="ti ti-phone-calling" />
                    </Link>
                    <Link href={all_routes.chat} className="btn btn-icon btn-light" aria-label="Chat">
                      <i className="ti ti-message-chatbot" />
                    </Link>
                    <Link href={all_routes.videoCall} className="btn btn-icon btn-light" aria-label="Video Call">
                      <i className="ti ti-video-plus" />
                    </Link>
                  </div>
                  <div>
                    <Link
                      href="#"
                      className="btn btn-icon btn-outline-light"
                      data-bs-toggle="dropdown"
                     aria-label="Lab result actions menu" aria-haspopup="true" aria-expanded="false">
                      <i className="ti ti-dots-vertical" aria-hidden="true" />
                    </Link>
                    <ul className="dropdown-menu p-2">
                      <li>
                        <Link
                          href="#"
                          className="dropdown-item d-flex align-items-center"
                          data-bs-toggle="modal"
                          data-bs-target="#edit_modal"
                        >
                          <i className="ti ti-edit me-1" />
                          Edit
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="#"
                          className="dropdown-item d-flex align-items-center"
                          data-bs-toggle="modal"
                          data-bs-target="#delete_modal"
                        >
                          <i className="ti ti-trash me-1" />
                          Delete
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xxl-3 col-xl-4 col-md-6">
            <div className="card">
              <div className="card-body">
                <div className="d-flex align-items-center mb-3">
                  <Link
                    href="#"
                    className="avatar flex-shrink-0 me-2"
                  >
                    <ImageWithBasePath src="assets/img/chat/chat-user-24.jpg" alt="user" />
                  </Link>
                  <div>
                    <h6 className="fs-14 fw-semibold mb-1">
                      <Link href="#">Jason Tapia</Link>
                    </h6>
                    <p className="fs-13 mb-0">jansontapia@example.com</p>
                  </div>
                </div>
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <Link href={all_routes.voiceCall} className="btn btn-icon btn-light" aria-label="Voice Call">
                      <i className="ti ti-phone-calling" />
                    </Link>
                    <Link href={all_routes.chat} className="btn btn-icon btn-light" aria-label="Chat">
                      <i className="ti ti-message-chatbot" />
                    </Link>
                    <Link href={all_routes.videoCall} className="btn btn-icon btn-light" aria-label="Video Call">
                      <i className="ti ti-video-plus" />
                    </Link>
                  </div>
                  <div>
                    <Link
                      href="#"
                      className="btn btn-icon btn-outline-light"
                      data-bs-toggle="dropdown"
                     aria-label="Lab result actions menu" aria-haspopup="true" aria-expanded="false">
                      <i className="ti ti-dots-vertical" aria-hidden="true" />
                    </Link>
                    <ul className="dropdown-menu p-2">
                      <li>
                        <Link
                          href="#"
                          className="dropdown-item d-flex align-items-center"
                          data-bs-toggle="modal"
                          data-bs-target="#edit_modal"
                        >
                          <i className="ti ti-edit me-1" />
                          Edit
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="#"
                          className="dropdown-item d-flex align-items-center"
                          data-bs-toggle="modal"
                          data-bs-target="#delete_modal"
                        >
                          <i className="ti ti-trash me-1" />
                          Delete
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xxl-3 col-xl-4 col-md-6">
            <div className="card">
              <div className="card-body">
                <div className="d-flex align-items-center mb-3">
                  <Link
                    href="#"
                    className="avatar flex-shrink-0 me-2"
                  >
                    <ImageWithBasePath src="assets/img/chat/chat-user-25.jpg" alt="user" />
                  </Link>
                  <div>
                    <h6 className="fs-14 fw-semibold mb-1">
                      <Link href="#">Jaime Johnson</Link>
                    </h6>
                    <p className="fs-13 mb-0">jaimejohnson@example.com</p>
                  </div>
                </div>
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <Link href={all_routes.voiceCall} className="btn btn-icon btn-light" aria-label="Voice Call">
                      <i className="ti ti-phone-calling" />
                    </Link>
                    <Link href={all_routes.chat} className="btn btn-icon btn-light" aria-label="Chat">
                      <i className="ti ti-message-chatbot" />
                    </Link>
                    <Link href={all_routes.videoCall} className="btn btn-icon btn-light" aria-label="Video Call">
                      <i className="ti ti-video-plus" />
                    </Link>
                  </div>
                  <div>
                    <Link
                      href="#"
                      className="btn btn-icon btn-outline-light"
                      data-bs-toggle="dropdown"
                     aria-label="Lab result actions menu" aria-haspopup="true" aria-expanded="false">
                      <i className="ti ti-dots-vertical" aria-hidden="true" />
                    </Link>
                    <ul className="dropdown-menu p-2">
                      <li>
                        <Link
                          href="#"
                          className="dropdown-item d-flex align-items-center"
                          data-bs-toggle="modal"
                          data-bs-target="#edit_modal"
                        >
                          <i className="ti ti-edit me-1" />
                          Edit
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="#"
                          className="dropdown-item d-flex align-items-center"
                          data-bs-toggle="modal"
                          data-bs-target="#delete_modal"
                        >
                          <i className="ti ti-trash me-1" />
                          Delete
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xxl-3 col-xl-4 col-md-6">
            <div className="card">
              <div className="card-body">
                <div className="d-flex align-items-center mb-3">
                  <Link
                    href="#"
                    className="avatar flex-shrink-0 me-2"
                  >
                    <ImageWithBasePath src="assets/img/chat/chat-user-26.jpg" alt="user" />
                  </Link>
                  <div>
                    <h6 className="fs-14 fw-semibold mb-1">
                      <Link href="#">Andrea Meek</Link>
                    </h6>
                    <p className="fs-13 mb-0">andreameek@example.com</p>
                  </div>
                </div>
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <Link href={all_routes.voiceCall} className="btn btn-icon btn-light" aria-label="Voice Call">
                      <i className="ti ti-phone-calling" />
                    </Link>
                    <Link href={all_routes.chat} className="btn btn-icon btn-light" aria-label="Chat">
                      <i className="ti ti-message-chatbot" />
                    </Link>
                    <Link href={all_routes.videoCall} className="btn btn-icon btn-light" aria-label="Video Call">
                      <i className="ti ti-video-plus" />
                    </Link>
                  </div>
                  <div>
                    <Link
                      href="#"
                      className="btn btn-icon btn-outline-light"
                      data-bs-toggle="dropdown"
                     aria-label="Lab result actions menu" aria-haspopup="true" aria-expanded="false">
                      <i className="ti ti-dots-vertical" aria-hidden="true" />
                    </Link>
                    <ul className="dropdown-menu p-2">
                      <li>
                        <Link
                          href="#"
                          className="dropdown-item d-flex align-items-center"
                          data-bs-toggle="modal"
                          data-bs-target="#edit_modal"
                        >
                          <i className="ti ti-edit me-1" />
                          Edit
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="#"
                          className="dropdown-item d-flex align-items-center"
                          data-bs-toggle="modal"
                          data-bs-target="#delete_modal"
                        >
                          <i className="ti ti-trash me-1" />
                          Delete
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xxl-3 col-xl-4 col-md-6">
            <div className="card">
              <div className="card-body">
                <div className="d-flex align-items-center mb-3">
                  <Link
                    href="#"
                    className="avatar flex-shrink-0 me-2"
                  >
                    <ImageWithBasePath src="assets/img/chat/chat-user-01.jpg" alt="user" />
                  </Link>
                  <div>
                    <h6 className="fs-14 fw-semibold mb-1">
                      <Link href="#">Benjamin Culpepper</Link>
                    </h6>
                    <p className="fs-13 mb-0">benjamin@example.com</p>
                  </div>
                </div>
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <Link href={all_routes.voiceCall} className="btn btn-icon btn-light" aria-label="Voice Call">
                      <i className="ti ti-phone-calling" />
                    </Link>
                    <Link href={all_routes.chat} className="btn btn-icon btn-light" aria-label="Chat">
                      <i className="ti ti-message-chatbot" />
                    </Link>
                    <Link href={all_routes.videoCall} className="btn btn-icon btn-light" aria-label="Video Call">
                      <i className="ti ti-video-plus" />
                    </Link>
                  </div>
                  <div>
                    <Link
                      href="#"
                      className="btn btn-icon btn-outline-light"
                      data-bs-toggle="dropdown"
                     aria-label="Lab result actions menu" aria-haspopup="true" aria-expanded="false">
                      <i className="ti ti-dots-vertical" aria-hidden="true" />
                    </Link>
                    <ul className="dropdown-menu p-2">
                      <li>
                        <Link
                          href="#"
                          className="dropdown-item d-flex align-items-center"
                          data-bs-toggle="modal"
                          data-bs-target="#edit_modal"
                        >
                          <i className="ti ti-edit me-1" />
                          Edit
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="#"
                          className="dropdown-item d-flex align-items-center"
                          data-bs-toggle="modal"
                          data-bs-target="#delete_modal"
                        >
                          <i className="ti ti-trash me-1" />
                          Delete
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xxl-3 col-xl-4 col-md-6">
            <div className="card">
              <div className="card-body">
                <div className="d-flex align-items-center mb-3">
                  <Link
                    href="#"
                    className="avatar flex-shrink-0 me-2"
                  >
                    <ImageWithBasePath src="assets/img/chat/chat-user-14.jpg" alt="user" />
                  </Link>
                  <div>
                    <h6 className="fs-14 fw-semibold mb-1">
                      <Link href="#">Charlotte Howard</Link>
                    </h6>
                    <p className="fs-13 mb-0">chaelotte@example.com</p>
                  </div>
                </div>
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <Link href={all_routes.voiceCall} className="btn btn-icon btn-light" aria-label="Voice Call">
                      <i className="ti ti-phone-calling" />
                    </Link>
                    <Link href={all_routes.chat} className="btn btn-icon btn-light" aria-label="Chat">
                      <i className="ti ti-message-chatbot" />
                    </Link>
                    <Link href={all_routes.videoCall} className="btn btn-icon btn-light" aria-label="Video Call">
                      <i className="ti ti-video-plus" />
                    </Link>
                  </div>
                  <div>
                    <Link
                      href="#"
                      className="btn btn-icon btn-outline-light"
                      data-bs-toggle="dropdown"
                     aria-label="Lab result actions menu" aria-haspopup="true" aria-expanded="false">
                      <i className="ti ti-dots-vertical" aria-hidden="true" />
                    </Link>
                    <ul className="dropdown-menu p-2">
                      <li>
                        <Link
                          href="#"
                          className="dropdown-item d-flex align-items-center"
                          data-bs-toggle="modal"
                          data-bs-target="#edit_modal"
                        >
                          <i className="ti ti-edit me-1" />
                          Edit
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="#"
                          className="dropdown-item d-flex align-items-center"
                          data-bs-toggle="modal"
                          data-bs-target="#delete_modal"
                        >
                          <i className="ti ti-trash me-1" />
                          Delete
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* End Content */}
      {/* Start Footer */}
     <CommonFooter/>
      {/* End Footer */}
    </div>
    {/* ========================
              End Page Content
          ========================= */}
          <ContactModal/>
  </>
  
  )
}

export default ContactsComponent