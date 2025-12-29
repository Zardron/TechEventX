import EventCard from "@/components/EventCard"
import ExploreBtn from "@/components/ExploreBtn"
import { events } from "@/lib/constants"

const page = () => {
  return (
    <section className="container mx-auto px-10 py-10">
      <h1 className="text-center">All Developer Events. <br /> <span className=" text-blue">One Platform. Your Future.</span></h1>
      <p className="text-center mt-5">Hackathons, Conferences, Workshops, and more. All in one place.</p>

      <ExploreBtn />

      <div className="mt-20 space-y-7">
        <h3>Featured Events</h3>
        <ul className="events">
          {events.map((event) => (
            <li key={event.title}>
              <EventCard {...event} />
            </li>
          ))}
        </ul>
      </div>
    </section >
  )
}

export default page