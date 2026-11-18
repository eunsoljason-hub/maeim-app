import type { Metadata } from "next";
import { PlayerScreen } from "@/components/screens/PlayerScreen";
import { COURSES } from "@/lib/constants";

export function generateStaticParams() {
  return COURSES.map((course) => ({ id: course.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const course = COURSES.find((item) => item.id === id) ?? COURSES[0];
  return {
    title: course.title,
    description: `${course.subtitle} · ${course.description}`,
  };
}

export default async function CoursePlayerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PlayerScreen key={id} courseId={id} />;
}
