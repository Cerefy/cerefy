// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { StitchGalleryPage } from "../pages/StitchGallery";

export const Route = createFileRoute("/stitch")({
  component: StitchGalleryPage,
});
