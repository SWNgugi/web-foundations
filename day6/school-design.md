# School Database Design

## Tables

- **students**: one row per student. Columns: `student_id` (primary key), `name`, and `email` (required and unique, so two students cannot share an email).
- **courses**: one row per course. Columns: `course_id` (primary key), `title`, and `credits`.
- **enrolments**: one row each time a student joins a course. Columns: `enrolment_id` (primary key), `student_id` and `course_id` (foreign keys to the other two tables), and `grade`. A UNIQUE rule on (`student_id`, `course_id`) stops the same student enrolling on the same course twice.

## Relationships

- **students to enrolments: one-to-many.** One student can have many enrolments, but each enrolment belongs to one student.
- **courses to enrolments: one-to-many.** One course can have many enrolments, but each enrolment belongs to one course.
- **students to courses: many-to-many.** A student takes many courses and a course has many students. A relational table cannot hold a list of ids in one column, so the `enrolments` join table sits in the middle and turns the many-to-many link into two one-to-many links. It is also the natural place to store the grade, because a grade belongs to one student on one course, not to either of them alone.

## Index

I would add an index on `enrolments(course_id)`:

```sql
CREATE INDEX idx_enrolments_course_id ON enrolments(course_id);
```

The UNIQUE rule already creates an index that helps when searching by student. Searches by course ("all students on this course", "students per course") would otherwise have to scan the whole enrolments table, which gets slow as the school grows.

## SQL or NoSQL?

I would choose SQL. The data is structured and highly related: students, courses and enrolments always link to each other, and the rules matter (unique emails, no double enrolment, enrolments that must point to real students and courses). A relational database enforces these rules with keys and constraints, and handles questions that cut across tables, such as students per course or students with no enrolments, with simple JOIN queries. A NoSQL document store would be a better fit if the data were loosely structured or needed to scale across many servers, but a school system does not need that.
