using DelimitedFiles
using Plots
using LinearAlgebra

function generate_question_graph(filename, maxScore, minRating=1500, maxRating=2000, problem=1)

allInfo = readdlm(filename, ',', String, '\n', skipstart=1)

ratings = parse.(Float64, allInfo[:,2])
scores = parse.(Int64, allInfo[:,4])

negativeRatings = findall((v) -> v == -1.0, ratings)
deleteat!(ratings, negativeRatings)
deleteat!(scores, negativeRatings)

# zeroScores = findall((v) -> v == 0, scores)
# deleteat!(ratings, zeroScores)
# deleteat!(times, zeroScores)
# deleteat!(scores, zeroScores)

plot(scores, ratings, title="Ratings vs Scores: Problem $problem", label="all", xlabel="scores", ylabel="ratings", seriestype=:scatter)

relevantRatings = findall((v) -> (v >= minRating-100 && v < maxRating+100), ratings)
actualRatings = ratings[relevantRatings]
actualScores = scores[relevantRatings]

plot!(actualScores, actualRatings, label="relevant", seriestype=:scatter)

linearRegressionMatrix = [ones(length(actualScores),1) actualScores]
parameters = linearRegressionMatrix\actualRatings
println(parameters)
plot!(0:maxScore, parameters[1].+parameters[2].*(0:maxScore), label="linear of relevant")
plot!(0:maxScore, (minRating-100) .+ (maxRating-minRating+200)/(maxScore) .* (0:maxScore), label="imposed fit")
weightedAverageRatings = (0.5).*((minRating-100) .+ (maxRating-minRating+200)/(maxScore) .* (0:maxScore)) .+ (0.5).*(parameters[1].+parameters[2].*(0:maxScore))
plot!(0:maxScore, weightedAverageRatings, label="weighted average of above two")

weightedAverageRatings = (0.5).*((minRating-100) .+ (maxRating-minRating+200)/(maxScore) .* (actualScores)) .+ (0.5).*(parameters[1].+parameters[2].*(actualScores))
mean = sum(actualRatings)/length(actualRatings)
numerator = sum((actualRatings .- weightedAverageRatings).^2)
denominator = sum((actualRatings .- mean).^2)
r2Value = 1 - numerator/denominator
println("r2 value = ", r2Value)

return plot!()

end

generate_question_graph("problem-0.csv", 3)
